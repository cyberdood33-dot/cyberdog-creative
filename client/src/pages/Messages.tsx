import { CyberdogShell, Eyebrow } from "@/components/CyberdogShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { KeyRound, LockKeyhole, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(data: ArrayBuffer | Uint8Array) {
  return btoa(String.fromCharCode(...Array.from(new Uint8Array(data))));
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

async function getDeviceKey() {
  const storageKey = "cyberdog-private-ecdh-key";
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    const pair = JSON.parse(stored);
    const privateKey = await crypto.subtle.importKey(
      "jwk",
      pair.privateJwk,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"]
    );
    return { privateKey, publicJwk: JSON.stringify(pair.publicJwk) };
  }

  const pair = (await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  )) as CryptoKeyPair;
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  localStorage.setItem(storageKey, JSON.stringify({ publicJwk, privateJwk }));
  return { privateKey: pair.privateKey, publicJwk: JSON.stringify(publicJwk) };
}

async function deriveConversationKey(privateKey: CryptoKey, remotePublicJwk: string, conversationId: string) {
  const remoteKey = await crypto.subtle.importKey(
    "jwk",
    JSON.parse(remotePublicJwk),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  const sharedSecret = await crypto.subtle.deriveBits({ name: "ECDH", public: remoteKey }, privateKey, 256);
  const hkdfKey = await crypto.subtle.importKey("raw", sharedSecret, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: encoder.encode(conversationId), info: encoder.encode("cyberdog-message-v1") },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export default function Messages() {
  const { isAuthenticated, user } = useAuth();
  const [recipientId, setRecipientId] = useState("");
  const [conversation, setConversation] = useState<{ id: string } | null>(null);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [remoteKey, setRemoteKey] = useState("");
  const [draft, setDraft] = useState("");
  const [displayMessages, setDisplayMessages] = useState<Array<any>>([]);

  const registerKey = trpc.messenger.registerDeviceKey.useMutation();
  const openConversation = trpc.messenger.open.useMutation();
  const remoteMember = trpc.messenger.memberKey.useQuery(
    { memberId: Number(recipientId) || 0 },
    { enabled: Number(recipientId) > 0 }
  );
  const sendEnvelope = trpc.messenger.send.useMutation();
  const messages = trpc.messenger.messages.useQuery(
    { conversationId: conversation?.id || "pending-conversation" },
    { enabled: Boolean(conversation?.id), refetchInterval: 10_000 }
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    getDeviceKey()
      .then(async result => {
        setPrivateKey(result.privateKey);
        await registerKey.mutateAsync({ publicJwk: result.publicJwk });
      })
      .catch(() => toast.error("Could not establish this browser’s private message key."));
  }, [isAuthenticated]);

  useEffect(() => {
    const decryptMessages = async () => {
      if (!conversation || !privateKey || !remoteKey) {
        setDisplayMessages([]);
        return;
      }
      const key = await deriveConversationKey(privateKey, remoteKey, conversation.id);
      const next = await Promise.all((messages.data || []).map(async (message: any) => {
        try {
          const plain = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: fromBase64(message.initializationVector) },
            key,
            fromBase64(message.ciphertext)
          );
          return { ...message, plaintext: decoder.decode(plain) };
        } catch {
          return { ...message, plaintext: "Unable to decrypt on this device." };
        }
      }));
      setDisplayMessages(next);
    };
    decryptMessages().catch(() => setDisplayMessages([]));
  }, [messages.data, conversation, privateKey, remoteKey]);

  if (!isAuthenticated) {
    return <CyberdogShell><section className="container grid min-h-[60vh] place-items-center py-16 text-center"><div><LockKeyhole className="mx-auto size-8 text-[#e52c2c]" /><h1 className="mt-4 font-display text-4xl font-extrabold">Private messages need a member account.</h1><p className="mt-3 max-w-md text-sm leading-6 text-zinc-600">Sign in to create browser-held encryption keys and exchange private message envelopes.</p></div></section></CyberdogShell>;
  }

  const begin = async () => {
    try {
      const publicEncryptionKey = remoteMember.data?.publicEncryptionKey;
      if (!publicEncryptionKey) throw new Error("This member has not enabled encrypted messaging on a browser yet.");
      const next = await openConversation.mutateAsync({ recipientId: Number(recipientId) });
      setRemoteKey(publicEncryptionKey);
      setConversation(next);
      toast.success("Secure conversation ready. New messages refresh every 10 seconds.");
    } catch (error: any) {
      toast.error(error.message || "Conversation could not be opened.");
    }
  };

  const sendMessage = async () => {
    try {
      if (!privateKey || !remoteKey || !conversation || !draft.trim()) return;
      const key = await deriveConversationKey(privateKey, remoteKey, conversation.id);
      const initializationVector = crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: initializationVector }, key, encoder.encode(draft));
      await sendEnvelope.mutateAsync({
        conversationId: conversation.id,
        ciphertext: toBase64(ciphertext),
        initializationVector: toBase64(initializationVector),
      });
      setDraft("");
      messages.refetch();
    } catch {
      toast.error("Message could not be encrypted and sent.");
    }
  };

  return <CyberdogShell><section className="container py-12"><Eyebrow>messages.cyberdog.io / Private desk</Eyebrow><div className="grid overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm lg:grid-cols-[310px_minmax(0,1fr)]">
    <aside className="border-b border-zinc-200 bg-[#fbfaf8] p-5 lg:border-b-0 lg:border-r"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-[#e52c2c] text-white"><KeyRound className="size-4" /></span><div><h1 className="text-sm font-extrabold">Private desk</h1><p className="text-[11px] text-zinc-500">Browser-encrypted messages</p></div></div><div className="mt-7"><label className="text-xs font-bold text-zinc-600">Start a conversation</label><input value={recipientId} onChange={event => setRecipientId(event.target.value.replace(/\D/g, ""))} placeholder="Member ID" className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#e52c2c]" /><button onClick={begin} disabled={!recipientId || openConversation.isPending || remoteMember.isLoading} className="mt-2 w-full rounded-lg bg-zinc-950 px-3 py-2.5 text-sm font-extrabold text-white disabled:opacity-50">Open secure chat</button></div><div className="mt-8 rounded-xl border border-red-100 bg-red-50 p-4"><ShieldCheck className="size-4 text-[#d22626]" /><p className="mt-2 text-xs font-extrabold text-zinc-900">What this protects</p><p className="mt-1 text-xs leading-5 text-zinc-600">Messages are encrypted in this browser before storage. Private message content is not passed into Cyberdog Assist.</p></div></aside>
    <div className="flex min-h-[520px] flex-col"><div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4"><div><p className="text-sm font-extrabold">{conversation ? `Member #${recipientId}` : "Choose a member"}</p><p className="mt-0.5 text-xs text-zinc-500">{conversation ? "ECDH + AES-GCM · refresh-based delivery" : "Your browser creates its device key when you sign in."}</p></div>{conversation && <button onClick={() => messages.refetch()} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-bold text-zinc-600"><RefreshCw className="size-3.5" />Refresh</button>}</div>
      <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f5f1] p-5">{conversation ? (displayMessages.length ? displayMessages.map(message => <div key={message.id} className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.senderId === user?.id ? "ml-auto bg-[#e52c2c] text-white" : "bg-white text-zinc-700 shadow-sm"}`}><p>{message.plaintext}</p><p className={`mt-1 text-[10px] ${message.senderId === user?.id ? "text-red-100" : "text-zinc-400"}`}>{new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p></div>) : <div className="grid h-full place-items-center text-center"><p className="text-sm font-bold text-zinc-600">The envelope is ready.</p><p className="mt-1 text-xs text-zinc-500">Send the first encrypted message.</p></div>) : <div className="grid h-full place-items-center text-center"><LockKeyhole className="size-7 text-zinc-300" /><p className="mt-3 text-sm font-bold text-zinc-600">Private by design, not by promise.</p></div>}</div>
      {conversation && <div className="border-t border-zinc-100 bg-white p-4"><div className="flex gap-2"><textarea value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Write an encrypted message…" className="min-h-11 flex-1 resize-none rounded-lg border border-zinc-200 p-2.5 text-sm outline-none focus:border-[#e52c2c]" /><button onClick={sendMessage} disabled={!draft.trim() || sendEnvelope.isPending} className="grid size-11 place-items-center rounded-lg bg-[#e52c2c] text-white disabled:opacity-50"><Send className="size-4" /></button></div><p className="mt-2 text-[10px] text-zinc-400">Enter to send · Shift + Enter for a new line · refreshes every 10 seconds</p></div>}</div>
  </div></section></CyberdogShell>;
}
