"use client";

import { Apple } from "lucide-react";
import { toast } from "sonner";
import { demoOAuth } from "@/lib/demo/auth";

export function OAuthButton({ provider }: { provider: "Google" | "Apple" }) {
  async function handleClick() {
    const result = await demoOAuth(provider);
    toast.info(result.message);
  }
  return (
    <button type="button" onClick={handleClick} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {provider === "Google" ? <span aria-hidden="true" className="text-base font-bold">G</span> : <Apple className="size-4" aria-hidden="true" />}
      Continue with {provider}
    </button>
  );
}

export function OAuthButtons() {
  return <div className="grid grid-cols-2 gap-3"><OAuthButton provider="Google" /><OAuthButton provider="Apple" /></div>;
}