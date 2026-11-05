"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, PanelLeftClose, PanelLeftOpen, UserRound } from "lucide-react";
import { nav } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "veltron.sidebar.collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  // Restore the user's browser-only sidebar preference after hydration.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    try { setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "true"); } catch { /* storage may be unavailable */ }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggle = () => setCollapsed((previous) => {
    const next = !previous;
    try { window.localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* storage may be unavailable */ }
    return next;
  });

  const renderGroup = (label: string, items: typeof nav.main | typeof nav.catalog | typeof nav.footer) => (
    <section key={label} className="space-y-1">
      {!collapsed && <h2 className="px-3 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</h2>}
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
        const Icon = item.icon;
        return <Link key={item.href} href={item.href} title={collapsed ? item.title : undefined} aria-current={active ? "page" : undefined} className={cn("flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", collapsed && "justify-center px-0", active ? "bg-brand/10 font-medium text-brand" : "text-muted-foreground hover:bg-accent hover:text-foreground")}><Icon className="size-[18px] shrink-0" /><span className={cn("truncate", collapsed && "sr-only")}>{item.title}</span>{active && !collapsed && <span className="ml-auto size-1.5 rounded-full bg-brand" />}</Link>;
      })}
    </section>
  );

  return (
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-card transition-[width] duration-200 md:flex md:flex-col", collapsed ? "w-[76px]" : "w-64")} aria-label="Main navigation">
      <div className={cn("flex h-16 items-center border-b border-border px-4", collapsed ? "justify-center" : "justify-between")}>
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5" aria-label="Veltron home">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-sm font-bold text-brand-fg">V</span>
          {!collapsed && <span className="truncate text-base font-semibold tracking-tight text-foreground">Veltron<span className="text-brand">.</span></span>}
        </Link>
        {!collapsed && <Button variant="ghost" size="sm" className="size-8 px-0" onClick={toggle} aria-label="Collapse sidebar"><PanelLeftClose className="size-4" /></Button>}
      </div>
      {collapsed && <Button variant="ghost" size="sm" className="mx-auto mt-3 size-9 px-0" onClick={toggle} aria-label="Expand sidebar"><PanelLeftOpen className="size-4" /></Button>}
      <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {renderGroup("Workspace", nav.main)}
        {renderGroup("Catalog", nav.catalog)}
        {renderGroup("Account", nav.footer)}
      </nav>
      <div className="border-t border-border p-3">
        <div className={cn("flex items-center gap-3 rounded-lg p-2", collapsed && "justify-center")}>
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><UserRound className="size-4" /></div>
          {!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">Your account</p><p className="truncate text-xs text-muted-foreground">Personal workspace</p></div>}
          {!collapsed && <Link href="/settings" className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Account settings"><ChevronRight className="size-4" /></Link>}
        </div>
        {!collapsed && <Link href="/sign-in" className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"><LogOut className="size-3.5" />Sign out</Link>}
      </div>
      {!ready && <span className="sr-only">Loading sidebar preferences</span>}
    </aside>
  );
}
