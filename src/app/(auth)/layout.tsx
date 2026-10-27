import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

function AuthMascot() {
  return (
    <svg viewBox="0 0 320 280" role="img" aria-label="Veltron geometric brand mascot" className="mx-auto w-full max-w-xs drop-shadow-2xl">
      <defs><linearGradient id="veltron-auth-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#8b9dff" /><stop offset="100%" stopColor="#00d6a0" /></linearGradient></defs>
      <circle cx="160" cy="140" r="108" fill="white" fillOpacity=".08" />
      <path d="M74 65 L126 65 L160 159 L194 65 L246 65 L181 220 L139 220 Z" fill="url(#veltron-auth-gradient)" />
      <circle cx="118" cy="116" r="8" fill="#07152f" /><circle cx="202" cy="116" r="8" fill="#07152f" />
      <path d="M132 151 Q160 177 188 151" stroke="#07152f" strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx="66" cy="202" r="9" fill="#00d6a0" /><circle cx="253" cy="89" r="6" fill="#aab8ff" />
    </svg>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <div className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <aside className="relative hidden overflow-hidden bg-[#07152f] px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,214,160,.22),transparent_36%),radial-gradient(circle_at_10%_80%,rgba(105,126,255,.28),transparent_40%)]" />
          <Link href="/" className="relative inline-flex w-fit items-center gap-2 text-lg font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-white text-[#07152f]">V</span> veltron<span className="text-emerald-300">.</span></Link>
          <div className="relative py-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80"><Sparkles className="size-3.5 text-emerald-300" /> Your money, in better motion</div>
            <h2 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">One clear view of everything you’re building.</h2>
            <p className="mt-5 max-w-md leading-7 text-white/65">Manage your services, track activity, and make confident decisions from one secure workspace.</p>
            <AuthMascot />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm"><ShieldCheck className="size-4 text-emerald-300" /> Security-first design</div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm"><CheckCircle2 className="size-4 text-emerald-300" /> Clear account controls</div>
            </div>
          </div>
          <div className="relative flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-xs text-white/50"><span>Built for clarity. Designed for you.</span><Link href="/security" className="inline-flex items-center gap-1 hover:text-white">Security <ArrowUpRight className="size-3.5" /></Link></div>
        </aside>
      </div>
    </main>
  );
}