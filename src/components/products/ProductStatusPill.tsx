import { cn } from "@/lib/utils";
import type { MyProductStatus } from "@/lib/catalog/my-products";

const styles: Record<MyProductStatus, string> = {
  Active: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Pending: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Expired: "border-border bg-muted text-muted-foreground",
};

export function ProductStatusPill({ status, className }: { status: MyProductStatus; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", styles[status], className)}><span className={cn("size-1.5 rounded-full", status === "Active" ? "bg-emerald-500" : status === "Pending" ? "bg-amber-500" : "bg-muted-foreground/50")} aria-hidden="true" />{status}</span>;
}
