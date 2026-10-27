import {
  Bitcoin,
  FileText,
  Globe,
  LayoutDashboard,
  LifeBuoy,
  PackageCheck,
  LineChart,
  Mail,
  Phone,
  PiggyBank,
  Settings,
  Smartphone,
} from "lucide-react";

export const nav = {
  main: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Analytics", href: "/analytics", icon: LineChart },
    { title: "Crypto", href: "/crypto", icon: Bitcoin },
    { title: "Savings", href: "/savings", icon: PiggyBank },
  ],
  catalog: [
    { title: "My Products", href: "/products", icon: PackageCheck },
    { title: "Website Creator", href: "/catalog/website", icon: Globe },
    { title: "Digital Tools", href: "/catalog/digital", icon: Smartphone },
    { title: "Call Tools", href: "/catalog/call", icon: Phone },
    { title: "Mailing Tools", href: "/catalog/mail", icon: Mail },
    { title: "Generator Tools", href: "/catalog/generator", icon: FileText },
  ],
  footer: [
    { title: "Settings", href: "/settings", icon: Settings },
    { title: "Support", href: "/support", icon: LifeBuoy },
  ],
} as const;

export const appNavigation = [...nav.main, ...nav.catalog, ...nav.footer] as const;

export function getPageTitle(pathname: string) {
  const item = appNavigation.find(
    (entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`),
  );
  if (item) return item.title;
  return pathname === "/"
    ? "Home"
    : pathname.split("/").filter(Boolean).at(-1)?.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? "Workspace";
}
