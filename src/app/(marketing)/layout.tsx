import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Services, simplified", template: "%s | Veltron Digital" },
  description: "Explore Veltron Digital services, account tools, and secure workspace features.",
  openGraph: { type: "website", siteName: "Veltron Digital", title: "Veltron Digital — Services, simplified", description: "Explore Veltron Digital services, account tools, and secure workspace features.", url: "/" },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}
