"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { neonAuthClient } from "@/lib/neon-auth/client";

export default function AuthProviders({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <NeonAuthUIProvider
      authClient={neonAuthClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      emailOTP
      redirectTo="/dashboard"
      Link={Link}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
