import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@neondatabase/auth-ui/css";
import { AppProviders } from "@/components/providers/AppProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://veltron.digital"),
  title: { default: "Veltron Digital — Services, simplified", template: "%s | Veltron Digital" },
  description: "A secure service marketplace with transparent orders, payments, and account controls.",
  openGraph: {
    type: "website",
    siteName: "Veltron Digital",
    title: "Veltron Digital — Services, simplified",
    description: "A secure service marketplace with transparent orders, payments, and account controls.",
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "Veltron Digital", description: "A secure service marketplace with transparent orders, payments, and account controls." },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
