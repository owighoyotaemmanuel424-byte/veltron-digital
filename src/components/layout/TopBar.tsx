"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { ChevronDown, LifeBuoy, LogOut, Menu, Moon, Search, Settings, Sun, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getPageTitle } from "@/lib/nav";
import { CommandMenu } from "@/components/layout/CommandMenu";
import { signOutAction } from "@/lib/auth/actions";

export function TopBar({ title }: { title?: React.ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const pageTitle = title ?? getPageTitle(pathname);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl md:px-7">
        <div className="min-w-0">
          <p className="eyebrow">Veltron workspace</p>
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground">{pageTitle}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCommandOpen(true)}
            aria-label="Search"
            className="size-9 rounded-full px-0 text-muted-foreground hover:text-foreground"
          >
            <Search className="size-[18px]" />
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="size-9 rounded-full px-0 text-muted-foreground hover:text-foreground"
          >
            <Link href="/support" aria-label="Support">
              <LifeBuoy className="size-[18px]" />
            </Link>
          </Button>

          <a href="/catalog" className="pill-cta hidden sm:inline-flex" aria-label="Join channel">
            Join channel
          </a>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="size-9 rounded-full px-0" aria-label="Open menu">
                <Menu className="size-[18px]" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1.5">
              <Link href="/catalog" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
                <UserRound className="size-4" /> Catalog
              </Link>
              <Link href="/settings" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
                <Settings className="size-4" /> Settings
              </Link>
              <Link href="/support" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
                <LifeBuoy className="size-4" /> Support
              </Link>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Account menu"
                className="ml-0.5 flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-1 pr-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="grid size-7 place-items-center rounded-full bg-brand/15 text-brand">
                  <UserRound className="size-4" />
                </span>
                <ChevronDown className="size-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-60 p-1.5">
              <div className="border-b border-border px-3 py-2">
                <p className="text-sm font-medium text-foreground">Your account</p>
                <p className="text-xs text-muted-foreground">Veltron platform</p>
              </div>
              <Link href="/settings" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
                <Settings className="size-4" /> Settings
              </Link>
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                {mounted && resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {mounted && resolvedTheme === "dark" ? "Light theme" : "Dark theme"}
              </button>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-danger hover:bg-accent"
                >
                  <LogOut className="size-4" /> Sign out
                </button>
              </form>
            </PopoverContent>
          </Popover>
        </div>
      </header>
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
