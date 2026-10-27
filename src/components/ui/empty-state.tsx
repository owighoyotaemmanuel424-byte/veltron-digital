import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
type EmptyStateProps = { title: string; description: string; actionLabel?: string; onAction?: () => void; actionHref?: string; illustration?: ReactNode; className?: string };
export function EmptyState({ title, description, actionLabel, onAction, actionHref, illustration, className }: EmptyStateProps) {
  return <section className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center", className)} aria-label={title}>
    <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-surface-2 text-muted-foreground">{illustration ?? <Inbox className="size-7" aria-hidden="true" />}</div>
    <h3 className="text-base font-semibold text-text">{title}</h3><p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
    {actionLabel && actionHref && <a href={actionHref} className="mt-5 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{actionLabel}</a>}
    {actionLabel && !actionHref && onAction && <Button className="mt-5" onClick={onAction}>{actionLabel}</Button>}
  </section>;
}
