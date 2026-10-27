"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { OTPInput } from "@/components/auth/OTPInput";
import { RecoveryCodeGrid } from "@/components/auth/RecoveryCodeGrid";
import { Button } from "@/components/ui/button";
import { demoResendOtp, demoVerifyOtp, demoVerifyRecoveryCode } from "@/lib/demo/auth";

export function TwoFactorChallenge({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = React.useState("");
  const [recovery, setRecovery] = React.useState(false);
  const [seconds, setSeconds] = React.useState(30);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const result = recovery ? await demoVerifyRecoveryCode(code) : await demoVerifyOtp(code);
    setBusy(false);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success(result.message);
    onSuccess();
  }

  async function resend() {
    const result = await demoResendOtp();
    if (result.ok) { setSeconds(30); setCode(""); toast.success(result.message); }
    else toast.error(result.message);
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-center"><span className="grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand"><ShieldCheck className="size-6" /></span></div>
      <div className="text-center"><h2 className="font-semibold">{recovery ? "Use a recovery code" : "Enter your verification code"}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{recovery ? "Enter one of your saved recovery codes." : "For this demo, use any six-digit code except 000000."}</p></div>
      <form onSubmit={submit} className="space-y-5">
        {recovery ? <input autoComplete="off" value={code} onChange={(event) => setCode(event.target.value)} placeholder="VELT-7K2M" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /> : <OTPInput value={code} onChange={setCode} />}
        <Button type="submit" className="w-full" disabled={busy || code.length < (recovery ? 4 : 6)}>{busy ? "Verifying…" : "Verify and continue"}</Button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <button type="button" className="text-brand hover:underline" onClick={() => { setRecovery(!recovery); setCode(""); }}>{recovery ? "Use authenticator code" : "Use recovery code"}</button>
        {seconds > 0 ? <span className="text-muted-foreground">Resend in {seconds}s</span> : <button type="button" onClick={resend} className="text-brand hover:underline">Resend code</button>}
      </div>
      {recovery ? <RecoveryCodeGrid /> : null}
      <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to sign in</Link>
    </div>
  );
}