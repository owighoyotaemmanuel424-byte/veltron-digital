"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Activity, ArrowRight, CircleHelp, Coins, LayoutDashboard, Search, Settings2, Store, WalletCards, Zap } from "lucide-react";
import { appNavigation } from "@/lib/nav";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const iconByTitle = { Dashboard: LayoutDashboard, Catalog: Store, Analytics: Activity, Crypto: Coins, Savings: WalletCards, Settings: Settings2, Support: CircleHelp } as const;

export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const go = React.useCallback((href: string) => { onOpenChange(false); router.push(href); }, [onOpenChange, router]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[18%] translate-y-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Command menu</DialogTitle>
        <Command className="w-full" loop>
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Command.Input autoFocus placeholder="Search pages and actions..." className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
          </div>
          <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">No matching pages or actions.</Command.Empty>
            <Command.Group heading="Navigate" className="px-1 py-1 text-xs text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2">
              {appNavigation.map((item) => {
                const Icon = iconByTitle[item.title];
                return <Command.Item key={item.href} value={item.title} onSelect={() => go(item.href)} className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"><Icon className="size-4 text-muted-foreground" />{item.title}<ArrowRight className="ml-auto size-3.5 opacity-50" /></Command.Item>;
              })}
            </Command.Group>
            <Command.Group heading="Quick actions" className="px-1 py-1 text-xs text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2">
              <Command.Item value="open settings preferences" onSelect={() => go("/settings")} className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-foreground aria-selected:bg-accent"><Zap className="size-4 text-muted-foreground" />Open preferences</Command.Item>
              <Command.Item value="get help support" onSelect={() => go("/support")} className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-foreground aria-selected:bg-accent"><CircleHelp className="size-4 text-muted-foreground" />Get support</Command.Item>
            </Command.Group>
          </Command.List>
          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground"><span>Navigate Veltron</span><span><kbd className="rounded border border-border px-1">↑</kbd> <kbd className="rounded border border-border px-1">↓</kbd> select <kbd className="rounded border border-border px-1">↵</kbd></span></div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
