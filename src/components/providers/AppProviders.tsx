"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

type AppProvidersProps = Readonly<{ children: ReactNode }>;

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEMO_MODE !== "false" && (
        <div role="status" className="sticky top-0 z-[100] border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs font-semibold tracking-wide text-amber-600 dark:text-amber-300">
          DEMO MODE — mock data
        </div>
      )}
      {children}
      <Toaster position="top-right" richColors theme="system" closeButton />
    </ThemeProvider>
  );
}
