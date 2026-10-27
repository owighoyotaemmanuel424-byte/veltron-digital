"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/AuthCard";
import { OAuthButtons } from "@/components/auth/OAuthButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoLogin } from "@/lib/demo/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [demoTwoFactor, setDemoTwoFactor] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [attempts, setAttempts] = React.useState(0);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.includes("@") || password.length < 1) { toast.error("Enter a valid email and your password."); return; }
    if (attempts >= 5) { toast.error("Too many demo attempts. Wait a moment before trying again."); return; }
    setBusy(true);
    const result = await demoLogin({ email, password, remember });
    setBusy(false);
    if (!result.ok) { setAttempts((current) => current + 1); toast.error(result.message); return; }
    setAttempts(0);
    if (demoTwoFactor) { toast.success("Password accepted. Complete the demo verification step."); router.push("/auth/2fa"); return; }
    toast.success(result.message);
    router.push("/dashboard");
  }

  return (
    <AuthCard title="Welcome back" description="Sign in to your Veltron workspace." footer={<>New to Veltron? <Link href="/signup" className="font-medium text-brand hover:underline">Create an account</Link></>}>
      <div className="mb-5"><OAuthButtons /></div>
      <div className="mb-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or continue with email<span className="h-px flex-1 bg-border" /></div>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><label htmlFor="login-email" className="text-sm font-medium">Email address</label><Input id="login-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
        <div className="space-y-1.5"><div className="flex items-center justify-between"><label htmlFor="login-password" className="text-sm font-medium">Password</label><Link href="/forgot-password" className="text-xs font-medium text-brand hover:underline">Forgot password?</Link></div><div className="relative"><Input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} className="pr-10" required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="size-4 rounded border-input accent-brand" />Remember this device</label>
        <label className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground"><input type="checkbox" checked={demoTwoFactor} onChange={(event) => setDemoTwoFactor(event.target.checked)} className="size-4 accent-brand" />Enable demo two-factor verification for this sign-in</label>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : <><LockKeyhole className="size-4" /> Sign in</>}</Button>
        <p className="text-center text-xs leading-5 text-muted-foreground">Demo preview only. This form does not authenticate against a production account.</p>
      </form>
    </AuthCard>
  );
}