import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getSessionUser } from "@/lib/session";
import { getPlatformSession } from "@/lib/api/session";

export const dynamic = "force-dynamic";

export default async function AuthenticatedAppLayout({ children }: { children: ReactNode }) {
  // The legacy Postgres session still guards some pages; the platform session is
  // what the API-backed screens need. Either one is enough to enter the shell.
  const legacyUser = await getSessionUser().catch(() => null);
  if (!legacyUser) {
    const platformSession = await getPlatformSession();
    if (!platformSession) redirect("/login");
  }
  return <AppShell>{children}</AppShell>;
}
