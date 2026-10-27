"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight, CalendarDays, Check, CircleHelp,
  Clock3, MoreHorizontal, Pause, Play, Plus, Sparkles, Target, Trash2, Wallet,
  X, PencilLine, TrendingUp,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { toast } from "sonner";
import { demoGrowth, demoVaults, type SavingsFrequency, type SavingsVault } from "@/lib/demo/savings";

type Period = "1M" | "3M" | "6M" | "1Y";
type VaultDraft = { name: string; target: string; apy: string; wallet: string; firstDeposit: string };
type RuleDraft = { amount: string; frequency: SavingsFrequency; wallet: string };

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const initialDraft: VaultDraft = { name: "", target: "", apy: "4.5", wallet: "Everyday wallet", firstDeposit: "25" };
const initialRule: RuleDraft = { amount: "25", frequency: "weekly", wallet: "Everyday wallet" };

function nextRunDate(frequency: SavingsFrequency, from = new Date()) {
  const next = new Date(from);
  if (frequency === "daily") next.setDate(next.getDate() + 1);
  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
  return next;
}
function dateLabel(date: Date | string | null) {
  if (!date) return "Not scheduled";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
}

function GoalRing({ progress, size = 82 }: { progress: number; size?: number }) {
  const [mounted, setMounted] = useState(false);
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const value = Math.min(100, Math.max(0, progress));
  return <div className="relative shrink-0" style={{ width: size, height: size }}>
    <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-label={`${Math.round(value)}% of goal`}>
      <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeOpacity=".09" strokeWidth="7" />
      <motion.circle cx="40" cy="40" r={radius} fill="none" stroke="#00d778" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: mounted ? circumference * (1 - value / 100) : circumference }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.12 }} onAnimationComplete={() => setMounted(true)} />
    </svg>
    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{Math.round(value)}%</span>
  </div>;
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <motion.div role="dialog" aria-modal="true" aria-label={title} initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold tracking-tight">{title}</h2>{subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div><button onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close dialog"><X size={18}/></button></div>
      {children}
    </motion.div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-medium"><span className="text-foreground/90">{label}</span>{children}</label>;
}
const inputClass = "w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryClass = "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-muted";

export default function SavingsPage() {
  const [vaults, setVaults] = useState<SavingsVault[]>(() => demoVaults.map((v) => ({ ...v })));
  const [createOpen, setCreateOpen] = useState(false);
  const [ruleVault, setRuleVault] = useState<SavingsVault | null>(null);
  const [deleteVault, setDeleteVault] = useState<SavingsVault | null>(null);
  const [menuVault, setMenuVault] = useState<string | null>(null);
  const [draft, setDraft] = useState<VaultDraft>(initialDraft);
  const [rule, setRule] = useState<RuleDraft>(initialRule);
  const [period, setPeriod] = useState<Period>("6M");
  const [saving, setSaving] = useState(false);

  const chartData = useMemo(() => {
    const count: Record<Period, number> = { "1M": 5, "3M": 7, "6M": 9, "1Y": 13 };
    return demoGrowth.slice(-count[period]);
  }, [period]);

  const totalSaved = vaults.reduce((sum, v) => sum + v.current, 0);
  const totalTarget = vaults.reduce((sum, v) => sum + v.target, 0);
  const weightedApy = totalSaved ? vaults.reduce((sum, v) => sum + v.current * v.apy, 0) / totalSaved : 0;
  const projectedAnnual = totalSaved * weightedApy / 100;

  function createVault(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = Number(draft.target);
    const firstDeposit = Number(draft.firstDeposit);
    const apy = Number(draft.apy);
    if (!draft.name.trim() || !Number.isFinite(target) || target <= 0 || !Number.isFinite(firstDeposit) || firstDeposit < 0 || !Number.isFinite(apy) || apy < 0 || apy > 100) {
      toast.error("Check the vault details and try again."); return;
    }
    setSaving(true);
    const newVault: SavingsVault = {
      id: `vault-${Date.now()}`, name: draft.name.trim(), target, current: firstDeposit,
      apy, wallet: draft.wallet, status: "active", nextDeposit: nextRunDate("weekly").toISOString(),
      rule: { amount: 25, frequency: "weekly", wallet: draft.wallet },
    };
    setVaults((previous) => [newVault, ...previous]);
    setCreateOpen(false); setDraft(initialDraft); setSaving(false);
    toast.success("Savings vault created", { description: `${newVault.name} is ready to grow.` });
  }

  function togglePause(vault: SavingsVault) {
    const previous = vaults;
    const nextStatus = vault.status === "paused" ? "active" : "paused";
    setVaults((current) => current.map((v) => v.id === vault.id ? { ...v, status: nextStatus } : v));
    setMenuVault(null);
    try { toast.success(nextStatus === "paused" ? "Vault paused" : "Vault resumed", { description: vault.name }); }
    catch { setVaults(previous); toast.error("Could not update vault. Changes were reverted."); }
  }

  function confirmDelete() {
    if (!deleteVault) return;
    const selected = deleteVault;
    const previous = vaults;
    setVaults((current) => current.filter((v) => v.id !== selected.id));
    setDeleteVault(null); setMenuVault(null);
    try { toast.success("Vault deleted", { description: selected.name }); }
    catch { setVaults(previous); toast.error("Could not delete vault. Changes were reverted."); }
  }

  function openRuleEditor(vault: SavingsVault) {
    setRuleVault(vault);
    setRule({ amount: String(vault.rule?.amount ?? 25), frequency: vault.rule?.frequency ?? "weekly", wallet: vault.rule?.wallet ?? vault.wallet });
    setMenuVault(null);
  }

  function saveRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ruleVault || Number(rule.amount) <= 0 || !Number.isFinite(Number(rule.amount))) { toast.error("Enter a valid deposit amount."); return; }
    const next = nextRunDate(rule.frequency);
    setVaults((current) => current.map((v) => v.id === ruleVault.id ? {
      ...v, wallet: rule.wallet, nextDeposit: next.toISOString(),
      rule: { amount: Number(rule.amount), frequency: rule.frequency, wallet: rule.wallet },
    } : v));
    setRuleVault(null);
    toast.success("Savings rule updated", { description: `Next deposit: ${dateLabel(next)}` });
  }

  return <div className="mx-auto max-w-[1400px] space-y-8">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-emerald-400"><Sparkles size={14}/> Build your future</div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Savings Vaults</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">Give your goals a home. Set a rhythm, track your progress, and watch your savings grow.</p></div>
      <button className={buttonClass} onClick={() => setCreateOpen(true)}><Plus size={17}/> New Vault</button>
    </header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: "Total saved", value: money(totalSaved), icon: Wallet, note: `Across ${vaults.length} vault${vaults.length === 1 ? "" : "s"}` },
        { label: "Combined goal", value: money(totalTarget), icon: Target, note: totalTarget ? `${Math.round(totalSaved / totalTarget * 100)}% of your target` : "Create your first goal" },
        { label: "Weighted APY", value: `${weightedApy.toFixed(2)}%`, icon: TrendingUp, note: "Across active balances" },
        { label: "Projected yearly growth", value: money(projectedAnnual), icon: ArrowUpRight, note: "At current displayed APY" },
      ].map((item) => <div key={item.label} className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between text-sm text-muted-foreground"><span>{item.label}</span><item.icon size={17} className="text-emerald-400"/></div>
        <div className="mt-3 text-2xl font-semibold tracking-tight">{item.value}</div><p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
      </div>)}
    </section>

    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold tracking-tight">Your vaults</h2><p className="mt-1 text-sm text-muted-foreground">Small, consistent deposits make meaningful progress.</p></div>{vaults.length > 0 && <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{vaults.length} total</span>}</div>
      {vaults.length === 0 ? <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
        <div className="mb-4 rounded-2xl bg-emerald-500/10 p-4 text-emerald-400"><Target size={28}/></div><h3 className="text-lg font-semibold">Your next goal starts here</h3><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Create a savings vault for something that matters to you and follow your progress over time.</p><button className={`${buttonClass} mt-5`} onClick={() => setCreateOpen(true)}><Plus size={16}/> Create your first vault</button>
      </div> : <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <AnimatePresence initial={false}>{vaults.map((vault) => {
          const progress = vault.target > 0 ? Math.min(100, vault.current / vault.target * 100) : 0;
          return <motion.article key={vault.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .97 }} transition={{ duration: .22 }} className="relative rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><GoalRing progress={progress}/><div className="min-w-0"><h3 className="truncate font-semibold">{vault.name}</h3><div className="mt-1 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${vault.status === "paused" ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"}`}>{vault.status}</span><span className="rounded-full border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground">{vault.apy.toFixed(2)}% APY</span></div></div></div>
              <div className="relative"><button onClick={() => setMenuVault(menuVault === vault.id ? null : vault.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Actions for ${vault.name}`}><MoreHorizontal size={19}/></button>
                <AnimatePresence>{menuVault === vault.id && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-border bg-card p-1.5 shadow-xl">
                  <button onClick={() => openRuleEditor(vault)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted"><PencilLine size={15}/> Edit rule</button>
                  <button onClick={() => togglePause(vault)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted">{vault.status === "paused" ? <Play size={15}/> : <Pause size={15}/>} {vault.status === "paused" ? "Resume vault" : "Pause vault"}</button>
                  <button onClick={() => { setDeleteVault(vault); setMenuVault(null); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-rose-400 hover:bg-rose-400/10"><Trash2 size={15}/> Delete vault</button>
                </motion.div>}</AnimatePresence>
              </div>
            </div>
            <div className="mt-6 flex items-end justify-between gap-4"><div><div className="text-2xl font-semibold tracking-tight">{money(vault.current)}</div><div className="mt-1 text-xs text-muted-foreground">of {money(vault.target)} goal</div></div><div className="pb-1 text-right"><div className="text-sm font-semibold text-emerald-300">{money(Math.max(0, vault.target - vault.current))}</div><div className="mt-1 text-xs text-muted-foreground">left to save</div></div></div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: .9, ease: "easeOut" }} className="h-full rounded-full bg-emerald-400"/></div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4"><div><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays size={13}/> Next deposit</div><p className="mt-1.5 text-sm font-medium">{vault.status === "paused" ? "Paused" : dateLabel(vault.nextDeposit)}</p></div><div><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Wallet size={13}/> Funding wallet</div><p className="mt-1.5 truncate text-sm font-medium">{vault.rule?.wallet ?? vault.wallet}</p></div></div>
          </motion.article>;
        })}</AnimatePresence>
      </div>}
    </section>

    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex items-center gap-2"><TrendingUp size={18} className="text-emerald-400"/><h2 className="text-xl font-semibold tracking-tight">APY growth tracker</h2></div><p className="mt-1.5 text-sm text-muted-foreground">Projected growth compared with your demo actual balance history.</p></div>
        <div className="flex rounded-xl border border-border bg-background p-1">{(["1M", "3M", "6M", "1Y"] as Period[]).map((p) => <button key={p} onClick={() => setPeriod(p)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${period === p ? "bg-emerald-500 text-black" : "text-muted-foreground hover:text-foreground"}`}>{p}</button>)}</div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-background p-4"><p className="text-xs text-muted-foreground">Projected balance</p><p className="mt-1 text-xl font-semibold">{money(chartData.at(-1)?.projected ?? 0)}</p><p className="mt-1 flex items-center gap-1 text-xs text-emerald-300"><ArrowUpRight size={13}/> Illustrative APY projection</p></div><div className="rounded-xl bg-background p-4"><p className="text-xs text-muted-foreground">Actual balance</p><p className="mt-1 text-xl font-semibold">{money(chartData.at(-1)?.actual ?? 0)}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><CircleHelp size={13}/> Demo data, not account records</p></div></div>
      <div className="mt-5 h-[280px] w-full sm:h-[330px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
        <defs><linearGradient id="projectedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b9cff" stopOpacity={.24}/><stop offset="95%" stopColor="#8b9cff" stopOpacity={0}/></linearGradient><linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00d778" stopOpacity={.2}/><stop offset="95%" stopColor="#00d778" stopOpacity={0}/></linearGradient></defs>
        <CartesianGrid stroke="currentColor" strokeOpacity={.08} vertical={false}/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "currentColor", opacity: .55, fontSize: 11 }} tickMargin={12}/><YAxis axisLine={false} tickLine={false} tick={{ fill: "currentColor", opacity: .55, fontSize: 11 }} tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`} width={54}/><Tooltip contentStyle={{ background: "#10141d", border: "1px solid #30394b", borderRadius: 12, color: "#f5f7fb" }} formatter={(value) => money(Number(value))}/><Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 12, paddingBottom: 16 }}/><Area type="monotone" dataKey="projected" name="Projected" stroke="#8b9cff" strokeWidth={2} strokeDasharray="5 4" fill="url(#projectedFill)" activeDot={{ r: 4 }}/><Area type="monotone" dataKey="actual" name="Actual" stroke="#00d778" strokeWidth={2.5} fill="url(#actualFill)" activeDot={{ r: 4 }}/>
      </AreaChart></ResponsiveContainer></div>
      <p className="mt-1 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><CircleHelp size={14} className="mt-0.5 shrink-0"/> APY and growth values are illustrative demo figures. Actual rates and returns depend on the product terms and are not guaranteed.</p>
    </section>

    <AnimatePresence>{createOpen && <Modal title="Create a savings vault" subtitle="Choose a goal and make your first deposit." onClose={() => setCreateOpen(false)}>
      <form onSubmit={createVault} className="grid gap-4"><Field label="Vault name"><input autoFocus required maxLength={60} className={inputClass} placeholder="e.g. Emergency fund" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}/></Field>
        <Field label="Target amount ($)"><input required min="1" step="0.01" type="number" className={inputClass} placeholder="5000.00" value={draft.target} onChange={(e) => setDraft({ ...draft, target: e.target.value })}/></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Displayed APY (%)"><input required min="0" max="100" step="0.01" type="number" className={inputClass} value={draft.apy} onChange={(e) => setDraft({ ...draft, apy: e.target.value })}/></Field><Field label="First deposit ($)"><input required min="0" step="0.01" type="number" className={inputClass} value={draft.firstDeposit} onChange={(e) => setDraft({ ...draft, firstDeposit: e.target.value })}/></Field></div>
        <Field label="Funding wallet"><select className={inputClass} value={draft.wallet} onChange={(e) => setDraft({ ...draft, wallet: e.target.value })}><option>Everyday wallet</option><option>Primary wallet</option><option>Income wallet</option></select></Field>
        <div className="rounded-xl border border-border bg-background p-3.5"><p className="text-sm font-medium">First deposit rule</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Your first deposit will be recorded in this demo. A weekly $25 savings rule will be set up, which you can edit at any time.</p></div>
        <div className="mt-2 flex gap-3"><button type="button" className={`${secondaryClass} flex-1`} onClick={() => setCreateOpen(false)}>Cancel</button><button type="submit" className={`${buttonClass} flex-1`} disabled={saving}><Plus size={16}/> Create vault</button></div>
      </form>
    </Modal>}</AnimatePresence>

    <AnimatePresence>{ruleVault && <Modal title="Edit savings rule" subtitle={`Automate how you save into ${ruleVault.name}.`} onClose={() => setRuleVault(null)}>
      <form onSubmit={saveRule} className="grid gap-4"><Field label="Deposit amount ($)"><input autoFocus required min="0.01" step="0.01" type="number" className={inputClass} value={rule.amount} onChange={(e) => setRule({ ...rule, amount: e.target.value })}/></Field>
        <Field label="Frequency"><select className={inputClass} value={rule.frequency} onChange={(e) => setRule({ ...rule, frequency: e.target.value as SavingsFrequency })}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></Field>
        <Field label="Source wallet"><select className={inputClass} value={rule.wallet} onChange={(e) => setRule({ ...rule, wallet: e.target.value })}><option>Everyday wallet</option><option>Primary wallet</option><option>Income wallet</option></select></Field>
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><Clock3 size={17} className="mt-0.5 text-emerald-400"/><div><p className="text-sm font-semibold">Next scheduled deposit</p><p className="mt-1 text-sm text-muted-foreground">{dateLabel(nextRunDate(rule.frequency))}</p><p className="mt-1 text-xs text-muted-foreground">{money(Number(rule.amount) || 0)} · {rule.frequency}</p></div></div>
        <div className="mt-2 flex gap-3"><button type="button" className={`${secondaryClass} flex-1`} onClick={() => setRuleVault(null)}>Cancel</button><button type="submit" className={`${buttonClass} flex-1`}><Check size={16}/> Save rule</button></div>
      </form>
    </Modal>}</AnimatePresence>

    <AnimatePresence>{deleteVault && <Modal title="Delete this vault?" subtitle="This action only affects this demo savings view." onClose={() => setDeleteVault(null)}>
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4"><p className="font-medium">{deleteVault.name}</p><p className="mt-1 text-sm text-muted-foreground">Current displayed balance: {money(deleteVault.current)}. Deleting removes the vault from this page; this demo does not move or withdraw money.</p></div>
      <div className="mt-5 flex gap-3"><button className={`${secondaryClass} flex-1`} onClick={() => setDeleteVault(null)}>Keep vault</button><button className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-400" onClick={confirmDelete}><Trash2 size={16}/> Delete vault</button></div>
    </Modal>}</AnimatePresence>
  </div>;
}
