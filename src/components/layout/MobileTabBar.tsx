"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavigation } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
  const pathname = usePathname();
  const tabs = appNavigation.filter((item) => ["Dashboard", "Catalog", "Crypto", "Savings", "Analytics", "Settings"].includes(item.title));
  return <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-border bg-card/95 px-1 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-2 backdrop-blur md:hidden">
    {tabs.map((item) => {
      const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
      const Icon = item.icon;
      return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex min-w-0 flex-col items-center gap-1 rounded-md px-0.5 py-1 text-[10px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "text-brand" : "text-muted-foreground")}><Icon className={cn("size-5", active && "fill-brand/10")} /><span className="truncate">{item.title}</span></Link>;
    })}
  </nav>;
}
