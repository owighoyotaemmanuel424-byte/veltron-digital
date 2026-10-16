import type { Metadata } from "next";
import "./globals.css";
import "@neondatabase/auth-ui/css";
export const metadata: Metadata = {
  title: "Veltron — Services, simplified",
  description: "A secure service marketplace with transparent orders, payments, and account controls."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
