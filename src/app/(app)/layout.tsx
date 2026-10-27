import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: { default: "Workspace", template: "%s | Veltron Digital" },
  description: "Manage your Veltron Digital account, activity, and savings workspace.",
  robots: { index: false, follow: false },
  openGraph: { type: "website", siteName: "Veltron Digital", title: "Veltron Digital workspace", description: "Manage your Veltron Digital account and activity." },
};
export const dynamic = "force-dynamic";

export default async function AuthenticatedAppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  return <AppShell>{children}</AppShell>;
}
