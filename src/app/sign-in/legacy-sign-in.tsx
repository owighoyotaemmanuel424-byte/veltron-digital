"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ...(totpCode ? { totpCode } : {}),
          ...(recoveryCode.trim() ? { recoveryCode: recoveryCode.trim() } : {}),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Sign-in failed.");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="vd-auth-page">
      <header className="vd-auth-header">
        <Link className="vd-brand" href="/"><span className="vd-brand-mark">v</span><span>veltron<span className="vd-brand-dot">.</span></span></Link>
        <Link className="vd-auth-back" href="/">← Back to home</Link>
      </header>
      <div className="vd-auth-layout">
        <aside className="vd-auth-story">
          <div className="vd-auth-kicker"><span className="vd-kicker-dot" /> YOUR DIGITAL WORKSPACE</div>
          <h1>Your next move<br />starts <span>here.</span></h1>
          <p>One account for the digital services you use, the work you launch, and the progress you make.</p>
          <div className="vd-auth-benefits">
            <div><span className="vd-auth-benefit-icon">↗</span><span><strong>Everything in one place</strong><small>Services, orders, and account activity.</small></span></div>
            <div><span className="vd-auth-benefit-icon">⌁</span><span><strong>Security that comes first</strong><small>Private access with account protection.</small></span></div>
          </div>
          <div className="vd-auth-story-foot"><span className="vd-auth-orb" /><span>BUILT FOR YOUR NEXT CHAPTER</span></div>
        </aside>
        <section className="vd-auth-form-panel">
          <div className="vd-auth-form-heading">
            <span className="vd-auth-mobile-mark">v.</span>
            <div className="vd-auth-eyebrow">WELCOME BACK</div>
            <h2>Sign in to Veltron</h2>
            <p>Pick up right where you left off.</p>
          </div>
          <form className="vd-auth-form" onSubmit={submit}>
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            <div className="vd-auth-label-row"><label htmlFor="password">Password</label><Link href="/auth/forgot-password">Forgot password?</Link></div>
            <div className="vd-auth-password">
              <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" />
              <button type="button" className="vd-auth-show" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
            </div>
            <details className="vd-auth-security">
              <summary>Using an authenticator or recovery code?</summary>
              <div className="vd-auth-security-fields">
                <label htmlFor="totp">Authenticator code <span>(if enabled)</span></label>
                <input id="totp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" />
                <label htmlFor="recovery-code">Recovery code <span>(instead of authenticator code)</span></label>
                <input id="recovery-code" autoComplete="off" maxLength={64} value={recoveryCode} onChange={e => setRecoveryCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 20))} placeholder="Enter an unused recovery code" />
              </div>
            </details>
            {error ? <p role="alert" className="vd-auth-error">{error}</p> : null}
            <button className="vd-auth-submit" disabled={busy}>{busy ? "Signing you in…" : "Sign in"}<span>↗</span></button>
            <div className="vd-auth-secure-note"><span>◈</span> Your account is protected with secure sign-in.</div>
          </form>
          <p className="vd-auth-switch">New to Veltron? <Link href="/sign-up">Create an account <span>→</span></Link></p>
          <p className="vd-auth-legal">By continuing, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
        </section>
      </div>
    </main>
  );
}
