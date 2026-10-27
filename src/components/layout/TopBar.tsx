"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, ChevronDown, Command as CommandIcon, LogOut, Moon, Search, Settings, Sun, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getPageTitle } from "@/lib/nav";
import { CommandMenu } from "@/components/layout/CommandMenu";

export function TopBar({ title }: { title?: React.ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  // The mounted flag avoids rendering theme-dependent controls before hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);
  const pageTitle = title ?? getPageTitle(pathname);

  return <>
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-7">
      <div className="min-w-0"><p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Veltron workspace</p><h1 className="truncate text-base font-semibold text-foreground">{pageTitle}</h1></div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button variant="outline" size="sm" className="hidden min-w-36 justify-start gap-2 text-muted-foreground sm:inline-flex md:min-w-48" onClick={() => setCommandOpen(true)} aria-label="Open search"><Search className="size-4" /><span className="mr-auto">Search</span><kbd className="inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px]"><CommandIcon className="size-3" />K</kbd></Button>
        <Button variant="ghost" size="sm" className="size-9 px-0 sm:hidden" onClick={() => setCommandOpen(true)} aria-label="Search"><Search className="size-4" /></Button>
        <Button variant="ghost" size="sm" className="size-9 px-0" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="Toggle theme" title="Toggle theme">{mounted && resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button>
        <Popover><PopoverTrigger asChild><Button variant="ghost" size="sm" className="relative size-9 px-0" aria-label="Notifications"><Bell className="size-4" /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-brand" /></Button></PopoverTrigger><PopoverContent align="end" className="w-72"><p className="font-medium text-foreground">Notifications</p><p className="mt-1 text-sm text-muted-foreground">You’re all caught up.</p></PopoverContent></Popover>
        <Popover><PopoverTrigger asChild><Button variant="ghost" size="sm" className="ml-1 flex h-9 gap-2 px-1.5" aria-label="Open account menu"><span className="grid size-7 place-items-center rounded-full bg-brand/10 text-brand"><UserRound className="size-4" /></span><ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" /></Button></PopoverTrigger><PopoverContent align="end" className="w-52 p-1.5"><div className="border-b border-border px-3 py-2"><p className="text-sm font-medium text-foreground">Your account</p><p className="text-xs text-muted-foreground">Personal workspace</p></div><Link href="/settings" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent"><UserRound className="size-4" />Profile</Link><Link href="/settings" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent"><Settings className="size-4" />Settings</Link><button type="button" onClick={async () => { try { await fetch("/api/auth/sign-out", { method: "POST", credentials: "same-origin" }); } finally { window.location.assign("/sign-in"); } }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-accent"><LogOut className="size-4" />Sign out</button></PopoverContent></Popover>
      </div>
    </header>
    {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEMO_MODE !== "false" && (
      <div role="status" className="fixed bottom-3 left-1/2 z-[100] -translate-x-1/2 rounded-full border border-amber-500/30 bg-background px-4 py-2 text-xs font-semibold text-amber-600 shadow-lg dark:text-amber-300">
        DEMO MODE — mock data
      </div>
    )}
    <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
  </>;
}
