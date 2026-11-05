import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getSessionUser } from "@/lib/session";
import { getPlatformSession } from "@/lib/api/session";

export const metadata: Metadata = {
  title: { default: "Workspace", template: "%s | Veltron Digital" },
  description: "Manage your Veltron Digital account, activity, and savings workspace.",
  robots: { index: false, follow: false },
  openGraph: { type: "website", siteName: "Veltron Digital", title: "Veltron Digital workspace", description: "Manage your Veltron Digital account and activity." },
};
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
