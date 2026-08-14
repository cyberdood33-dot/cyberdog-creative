import { trpc } from "@/lib/trpc";
import { Dog, LoaderCircle, ShieldAlert, Zap } from "lucide-react";
import { useEffect, useState, type PropsWithChildren } from "react";
import { BootstrapProvider } from "@/contexts/BootstrapContext";

export function PrefetchGate({ children }: PropsWithChildren) {
  const preload = trpc.bootstrap.preload.useQuery(undefined, { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false, retry: 2 });
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { if (preload.isSuccess) { const timer = window.setTimeout(() => setRevealed(true), 420); return () => window.clearTimeout(timer); } }, [preload.isSuccess]);
  if (!revealed) return <div className="grid min-h-screen place-items-center bg-[#131313] px-6 text-white">
    <div className="w-full max-w-md text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#e52c2c] shadow-[0_0_55px_rgba(229,44,44,.45)]"><Dog className="size-9" /></div>
      <h1 className="mt-6 font-display text-3xl font-extrabold tracking-[-.05em]">Cyberdog Creative.</h1>
      {preload.isError ? <div className="mt-8 rounded-xl border border-red-400/30 bg-red-950/40 p-5 text-left"><div className="flex items-center gap-2 font-bold text-red-200"><ShieldAlert className="size-4" /> Unable to secure the initial briefing</div><p className="mt-2 text-sm leading-6 text-red-100/80">The site keeps its content behind the prefetch gate until the first data load finishes.</p><button onClick={() => preload.refetch()} className="mt-4 rounded-lg bg-white px-3 py-2 text-sm font-extrabold text-zinc-900">Try again</button></div> : <><div className="mt-7 h-1.5 overflow-hidden rounded-full bg-zinc-800"><div className="h-full w-2/3 animate-[load_1.5s_ease-in-out_infinite] rounded-full bg-[#e52c2c]" /></div><p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-zinc-400"><LoaderCircle className="size-4 animate-spin" /> Syncing the work, journal, community, and docs.</p><p className="mt-2 inline-flex items-center gap-1.5 text-xs text-zinc-600"><Zap className="size-3.5" /> Preparing first-interaction cache</p></>}
    </div>
  </div>;
  return <BootstrapProvider value={preload.data ?? { portfolio: [], posts: [], feed: [], docs: [], tickets: [] }}>{children}</BootstrapProvider>;
}
