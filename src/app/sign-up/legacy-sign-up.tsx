"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Registration failed.");
      setMessage(d.message || "Check your inbox for a verification link.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError("");
    setMessage("");
    setResending(true);
    try {
      const r = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not request a new link.");
      setMessage(d.message || "If the account needs verification, a new link will be sent.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not request a new link.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="vd-auth-page">
      <header className="vd-auth-header">
        <Link className="vd-brand" href="/"><span className="vd-brand-mark">v</span><span>veltron<span className="vd-brand-dot">.</span></span></Link>
        <Link className="vd-auth-back" href="/">← Back to home</Link>
      </header>
      <div className="vd-auth-layout vd-auth-layout-signup">
        <aside className="vd-auth-story">
          <div className="vd-auth-kicker"><span className="vd-kicker-dot" /> A BETTER WAY TO GET THINGS DONE</div>
          <h1>Make room<br />for <span>what’s next.</span></h1>
          <p>Build your digital workspace and keep your services, orders, and account details connected.</p>
          <div className="vd-auth-benefits">
            <div><span className="vd-auth-benefit-icon">✳</span><span><strong>Start with one simple account</strong><small>Get your workspace ready in minutes.</small></span></div>
            <div><span className="vd-auth-benefit-icon">↗</span><span><strong>Stay in control</strong><small>Keep track of your services and activity.</small></span></div>
          </div>
          <div className="vd-auth-story-foot"><span className="vd-auth-orb" /><span>YOUR IDEAS. YOUR MOMENTUM.</span></div>
        </aside>
        <section className="vd-auth-form-panel">
          <div className="vd-auth-form-heading">
            <span className="vd-auth-mobile-mark">v.</span>
            <div className="vd-auth-eyebrow">GET STARTED</div>
            <h2>Create your account</h2>
            <p>Join Veltron and set up your workspace.</p>
          </div>
          <form className="vd-auth-form" onSubmit={submit}>
            <label htmlFor="name">Full name <span className="vd-auth-optional">Optional</span></label>
            <input id="name" autoComplete="name" maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="How should we address you?" />
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            <label htmlFor="password">Create password</label>
            <div className="vd-auth-password">
              <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 12 characters" />
              <button type="button" className="vd-auth-show" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
            </div>
            <p className="vd-auth-hint"><span>◈</span> Use at least 12 characters for a stronger password.</p>
            {error ? <p role="alert" className="vd-auth-error">{error}</p> : null}
            {message ? <div role="status" className="vd-auth-success"><span>✓</span><div><strong>You're on your way</strong><p>{message}</p><button type="button" onClick={resend} disabled={resending || !email.trim()}>{resending ? "Requesting link…" : "Resend verification email"}</button></div></div> : null}
            <button className="vd-auth-submit" disabled={busy}>{busy ? "Creating your account…" : "Create account"}<span>↗</span></button>
          </form>
          <p className="vd-auth-switch">Already have an account? <Link href="/sign-in">Sign in <span>→</span></Link></p>
          <p className="vd-auth-legal">By creating an account, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
        </section>
      </div>
    </main>
  );
}
