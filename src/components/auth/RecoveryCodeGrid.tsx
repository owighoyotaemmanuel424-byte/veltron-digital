"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

const codes = ["VELT-7K2M", "VELT-9Q4R", "VELT-3N8P", "VELT-5X1D", "VELT-6B7W", "VELT-2H9C"];

export function RecoveryCodeGrid() {
  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      toast.success("Demo recovery codes copied.");
    } catch {
      toast.error("Clipboard access is unavailable. Copy the codes manually.");
    }
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {codes.map((code) => <code key={code} className="rounded-md border border-border bg-muted/40 px-3 py-2 text-center text-sm font-medium tracking-wide">{code}</code>)}
      </div>
      <button type="button" onClick={copyCodes} className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"><Copy className="size-4" /> Copy recovery codes</button>
      <p className="text-xs leading-5 text-muted-foreground">These are illustrative demo codes only. Do not use them to protect a real account.</p>
    </div>
  );
}