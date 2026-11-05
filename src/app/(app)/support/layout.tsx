import type { Metadata } from "next";
export const metadata: Metadata = { title: "Support center", description: "Search Veltron Digital help articles, submit a support ticket, and follow up on requests.", openGraph: { title: "Support center | Veltron Digital", description: "Find help articles and contact support.", url: "/support", type: "website" } };
export default function SupportLayout({ children }: { children: React.ReactNode }) { return children; }
