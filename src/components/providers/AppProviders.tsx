"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

type AppProvidersProps = Readonly<{ children: ReactNode }>;

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      {children}
      <Toaster position="top-right" richColors theme="system" closeButton />
    </ThemeProvider>
  );
}
