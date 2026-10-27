import { cn } from "@/lib/utils";
type StatusPillProps = { label: string; className?: string; dotClassName?: string };
export function StatusPill({ label, className, dotClassName }: StatusPillProps) {
  return <span className={cn("inline-flex items-center gap-2 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success", className)}><span aria-hidden="true" className={cn("size-2 rounded-full bg-success", dotClassName)} />{label}</span>;
}
