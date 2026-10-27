"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/AuthCard";
import { OTPInput } from "@/components/auth/OTPInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoRequestPasswordReset, demoResetPassword, demoVerifyOtp } from "@/lib/demo/auth";
const steps = [{ title: "Email", icon: Mail }, { title: "Verify", icon: ShieldCheck }, { title: "New password", icon: KeyRound }];
export default function ForgotPasswordPage() {
  const [step, setStep] = React.useState(0);
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  async function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); const result = await demoRequestPasswordReset(email); setBusy(false);
    if (!result.ok) { toast.error(result.message); return; } toast.success(result.message); setStep(1);
  }
  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); const result = await demoVerifyOtp(code); setBusy(false);
    if (!result.ok) { toast.error(result.message); return; } toast.success("Email verified for this demo."); setStep(2);
  }
  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (password !== confirm) { toast.error("Passwords do not match."); return; }
    setBusy(true); const result = await demoResetPassword(password); setBusy(false);
    if (!result.ok) { toast.error(result.message); return; } toast.success(result.message); window.location.assign("/login");
  }
  return <AuthCard title="Reset your password" description="Recover access in three quick steps." footer={<>Remembered it? <Link href="/login" className="font-medium text-brand hover:underline">Back to sign in</Link></>}>
    <ol className="mb-7 grid grid-cols-3 gap-2" aria-label="Password reset progress">{steps.map((item,index)=>{const Icon=item.icon;const active=index===step;const complete=index<step;return <li key={item.title} className="min-w-0 text-center"><span className={"mx-auto grid size-9 place-items-center rounded-full border "+(complete||active?"border-brand bg-brand text-brand-fg":"border-border bg-muted text-muted-foreground")}>{complete?<Check className="size-4"/>:<Icon className="size-4"/>}</span><span className={"mt-2 block truncate text-xs "+(active?"font-semibold text-foreground":"text-muted-foreground")}>{item.title}</span></li>;})}</ol>
    {step===0?<form onSubmit={requestCode} className="space-y-4"><div className="space-y-1.5"><label htmlFor="reset-email" className="text-sm font-medium">Email address</label><Input id="reset-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required /></div><Button className="w-full" type="submit" disabled={busy}>{busy?"Sending code…":"Send verification code"}</Button></form>:null}
    {step===1?<form onSubmit={verifyCode} className="space-y-5"><p className="text-sm leading-6 text-muted-foreground">Enter the six-digit code for <strong className="font-medium text-foreground">{email}</strong>. Demo accepts any six digits except 000000.</p><OTPInput value={code} onChange={setCode}/><Button className="w-full" type="submit" disabled={busy||code.length!==6}>{busy?"Checking code…":"Verify code"}</Button><button type="button" onClick={()=>setStep(0)} className="w-full text-sm text-brand hover:underline">Change email address</button></form>:null}
    {step===2?<form onSubmit={updatePassword} className="space-y-4"><div className="space-y-1.5"><label htmlFor="new-password" className="text-sm font-medium">New password</label><Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required placeholder="At least 8 characters"/></div><div className="space-y-1.5"><label htmlFor="confirm-new-password" className="text-sm font-medium">Confirm new password</label><Input id="confirm-new-password" type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required placeholder="Repeat your password"/></div><Button className="w-full" type="submit" disabled={busy}>{busy?"Updating password…":"Update password"}</Button></form>:null}
    <div className="mt-6 border-t border-border pt-4"><button type="button" disabled={step===0||busy} onClick={()=>setStep(current=>Math.max(0,current-1))} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:invisible"><ArrowLeft className="size-4"/> Previous step</button></div>
    <p className="mt-3 text-xs leading-5 text-muted-foreground">Demo only: no email is sent and no production password is changed.</p>
  </AuthCard>;
}