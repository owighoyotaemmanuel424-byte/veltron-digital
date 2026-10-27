import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function AuthCard({ children, title, description, footer, className }: {
  children: ReactNode; title: string; description?: string; footer?: ReactNode; className?: string;
}) {
  return (
    <section className={cn("w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/[0.03] sm:p-8", className)}>
      <Link href="/" className="mb-8 inline-flex items-center gap-2 font-semibold tracking-tight text-foreground" aria-label="Veltron home">
        <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-fg">V</span>
        <span>veltron<span className="text-brand">.</span></span>
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {children}
      {footer ? <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
    </section>
  );
}