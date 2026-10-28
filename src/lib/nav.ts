import { Activity, CircleHelp, Coins, LayoutDashboard, Settings2, Store, WalletCards } from "lucide-react";

export const appNavigation = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Catalog", href: "/catalog", icon: Store },
  { title: "Analytics", href: "/analytics", icon: Activity },
  { title: "Crypto", href: "/crypto", icon: Coins },
  { title: "Savings", href: "/savings", icon: WalletCards },
  { title: "Settings", href: "/settings", icon: Settings2 },
  { title: "Support", href: "/support", icon: CircleHelp },
] as const;

export function getPageTitle(pathname: string) {
  const item = appNavigation.find(
    (entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`),
  );
  if (item) return item.title;
  return pathname === "/" ? "Home" : pathname.split("/").filter(Boolean).at(-1)?.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? "Workspace";
}
