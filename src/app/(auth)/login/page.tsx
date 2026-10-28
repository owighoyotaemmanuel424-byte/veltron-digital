"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInAction, type SignInState } from "@/lib/auth/actions";

export default function LoginPage() {
  const [state, formAction, pending] = React.useActionState<SignInState, FormData>(signInAction, null);
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 space-y-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="size-3.5 text-brand" aria-hidden="true" />
          Secure platform sign-in
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in with your platform account. Sessions are issued by the API as short-lived JWTs.
        </p>
      </div>

      <form action={formAction} className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">Email address</label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Link href="/forgot-password" className="text-xs font-medium text-brand hover:underline">Forgot?</Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Your password"
              className="h-11 pr-11"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-0 top-0 grid size-11 place-items-center text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="totp" className="text-sm font-medium">
            Authenticator code <span className="font-normal text-muted-foreground">(if enabled)</span>
          </label>
          <Input
            id="totp"
            name="totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            className="h-11 tracking-[0.4em]"
          />
        </div>

        {state?.error ? (
          <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" variant="brand" className="h-11 w-full" disabled={pending}>
          {pending ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" />Signing in…</> : <><LockKeyhole className="size-4" aria-hidden="true" />Sign in</>}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          No account? <Link href="/signup" className="font-medium text-brand hover:underline">Create one</Link>
        </p>
      </form>
    </main>
  );
}
