import type { Metadata } from "next";
export const metadata: Metadata = { title: "Frequently asked questions", description: "Answers to common questions about Veltron Digital accounts, security, payments, and savings.", openGraph: { title: "Frequently asked questions | Veltron Digital", description: "Answers about accounts, security, payments, and savings.", url: "/faq", type: "website" } };
export default function FAQLayout({ children }: { children: React.ReactNode }) { return children; }
