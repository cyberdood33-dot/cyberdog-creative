import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { cn } from "@/lib/utils";
import { Bell, ChevronRight, CircleHelp, Compass, Dog, FileText, Home, LogOut, MessageSquareText, Newspaper, PanelTop, Search, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { PropsWithChildren, ReactNode } from "react";

type NavItem = { label: string; href: string; icon: typeof Home };

const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "About", href: "/about", icon: Compass },
  { label: "Work", href: "/work", icon: PanelTop },
  { label: "Journal", href: "/journal", icon: Newspaper },
  { label: "Feed", href: "/feed", icon: Sparkles },
  { label: "Community", href: "/community", icon: UsersRound },
  { label: "Docs", href: "/docs", icon: FileText },
  { label: "Contact", href: "/contact", icon: CircleHelp },
];

export function productUrl(area: "root" | "blog" | "community" | "docs" | "account" | "support", fallback: string) {
  if (typeof window === "undefined") return fallback;
  const host = window.location.hostname;
  if (host.endsWith("cyberdog.io")) {
    const subdomain = area === "root" ? "" : `${area}.`;
    return `https://${subdomain}cyberdog.io`;
  }
  return fallback;
}

export function ExternalOrLocalLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  if (href.startsWith("http")) return <a href={href} className={className}>{children}</a>;
  return <Link href={href} className={className}>{children}</Link>;
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="group flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-red-500">
    <span className="grid size-9 place-items-center rounded-xl bg-[#e52c2c] text-white shadow-[0_7px_18px_rgba(229,44,44,.30)] transition-transform group-hover:-rotate-6">
      <Dog className="size-5" strokeWidth={2.6} />
    </span>
    {!compact && <span className="font-display text-[1.05rem] font-extrabold tracking-[-0.04em] text-zinc-950">Cyberdog <em className="font-display not-italic text-[#e52c2c]">Creative.</em></span>}
  </Link>;
}

export function CyberdogShell({ children, className }: PropsWithChildren<{ className?: string }>) {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  return <div className="min-h-screen bg-[#f7f5f1] text-zinc-950">
    <header className="sticky top-0 z-40 border-b border-zinc-200/90 bg-[#f7f5f1]/92 backdrop-blur-xl">
      <div className="container flex h-[68px] items-center justify-between gap-4">
        <BrandMark />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
            return <Link key={item.href} href={item.href} className={cn("inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors", active ? "bg-white text-[#c92020] shadow-sm ring-1 ring-zinc-200" : "text-zinc-600 hover:bg-white hover:text-zinc-950")}><Icon className="size-3.5" />{item.label}</Link>;
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/search" className="grid size-9 place-items-center rounded-lg text-zinc-500 hover:bg-white hover:text-zinc-900" aria-label="Search Cyberdog Creative"><Search className="size-4" /></Link>
          {isAuthenticated ? <>
            <Link href="/messages" className="hidden sm:grid size-9 place-items-center rounded-lg text-zinc-500 hover:bg-white hover:text-zinc-900" aria-label="Messages"><MessageSquareText className="size-4" /></Link>
            <Link href="/account" className="hidden sm:grid size-9 place-items-center rounded-lg text-zinc-500 hover:bg-white hover:text-zinc-900" aria-label="Account"><Bell className="size-4" /></Link>
            <button onClick={() => logout()} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-800 shadow-sm transition hover:border-zinc-300"><span className="hidden sm:inline">{user?.name?.split(" ")[0] || "Account"}</span><LogOut className="size-3.5" /></button>
          </> : <button onClick={() => startLogin()} className="rounded-lg bg-[#e52c2c] px-4 py-2 text-sm font-extrabold text-white shadow-[0_5px_16px_rgba(229,44,44,.25)] transition hover:bg-[#ca1f1f] active:scale-[.97]">Sign in</button>}
        </div>
      </div>
    </header>
    <main className={className}>{children}</main>
    <footer className="border-t border-zinc-200 bg-white">
      <div className="container grid gap-9 py-12 md:grid-cols-[1.25fr_repeat(3,1fr)]">
        <div><BrandMark /><p className="mt-4 max-w-sm text-sm leading-6 text-zinc-600">A creative systems studio and developer community for people who care about signal, craft, and useful technology.</p><div className="spectrum-rule mt-6 max-w-[220px]" /></div>
        <FooterColumn title="Suite" links={[['Main site', '/'], ['blog.cyberdog.io', productUrl('blog','/journal')], ['community.cyberdog.io', productUrl('community','/community')], ['docs.cyberdog.io', productUrl('docs','/docs')]]} />
        <FooterColumn title="Member" links={[['Cyberdog Account', productUrl('account','/account')], ['Private messages', '/messages'], ['Social feed', '/feed'], ['Profile', '/account']]} />
        <FooterColumn title="Support" links={[['Help desk', productUrl('support','/support')], ['Contact studio', '/contact'], ['Security posture', '/account#security'], ['Status', '/support']]} />
      </div>
      <div className="container flex flex-col gap-2 border-t border-zinc-100 py-5 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 Cyberdog Creative. Built for the good kind of trouble.</span><span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-[#e52c2c]" /> Subdomain-ready product suite</span></div>
    </footer>
  </div>;
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return <div><h2 className="text-sm font-extrabold text-zinc-950">{title}</h2><ul className="mt-3 space-y-2.5">{links.map(([label, href]) => <li key={label}><ExternalOrLocalLink href={href} className="text-sm text-zinc-600 transition hover:text-[#d92828]">{label}</ExternalOrLocalLink></li>)}</ul></div>;
}

export function Eyebrow({ children }: { children: ReactNode }) { return <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#cc2929]"><span className="size-1.5 rounded-full bg-[#e52c2c]" />{children}</p>; }
export function ArrowLink({ href, children }: { href: string; children: ReactNode }) { return <ExternalOrLocalLink href={href} className="inline-flex items-center gap-1 text-sm font-extrabold text-[#cf2626] transition hover:gap-2">{children}<ChevronRight className="size-4" /></ExternalOrLocalLink>; }
export function SupportButton() { return <Link href="/support" className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-700 shadow-sm transition hover:border-zinc-300"><CircleHelp className="size-4 text-[#e52c2c]" /> Help & support</Link>; }
