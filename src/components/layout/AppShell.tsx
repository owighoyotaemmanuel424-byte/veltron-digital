"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { StatusBanner } from "@/components/shared/StatusBanner";
import { cn } from "@/lib/utils";

export function AppShell({ children, title, className }: { children: ReactNode; title?: string; className?: string }) {
  return <div className="min-h-screen bg-background text-foreground">
    <Sidebar />
    <div className="min-h-screen transition-[padding] md:pl-64">
      <TopBar title={title} />
      <StatusBanner className="border-x-0" />
      <main className={cn("mx-auto w-full max-w-[1600px] px-4 py-6 pb-28 sm:px-6 md:px-8 md:pb-10", className)}>{children}</main>
    </div>
    <MobileTabBar />
  </div>;
}
