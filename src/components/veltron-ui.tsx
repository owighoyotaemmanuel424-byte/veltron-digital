import type { ReactNode } from "react";
import Link from "next/link";

type PageHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
};

export function PageHeading({ eyebrow, title, description, action }: PageHeadingProps) {
  return (
    <div className="vd-page-heading">
      <div className="vd-page-heading-copy">
        {eyebrow ? <div className="vd-page-eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <Link className="vd-ui-button vd-ui-button-primary" href={action.href}>{action.label}<span aria-hidden="true">↗</span></Link> : null}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`vd-ui-panel ${className}`.trim()}>{children}</section>;
}

export function MetricCard({ label, value, detail, icon }: { label: string; value: ReactNode; detail?: string; icon?: ReactNode }) {
  return (
    <article className="vd-ui-metric">
      <div className="vd-ui-metric-top"><span>{label}</span>{icon ? <span className="vd-ui-metric-icon" aria-hidden="true">{icon}</span> : null}</div>
      <strong>{value}</strong>
      {detail ? <p>{detail}</p> : null}
    </article>
  );
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "accent" }) {
  return <span className={`vd-ui-status vd-ui-status-${tone}`}>{children}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: { label: string; href: string } }) {
  return (
    <div className="vd-ui-empty">
      <span className="vd-ui-empty-mark" aria-hidden="true">◇</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <Link className="vd-ui-button vd-ui-button-primary" href={action.href}>{action.label}<span aria-hidden="true">↗</span></Link> : null}
    </div>
  );
}

export function ToolCard({ title, description, href, category, icon = "↗" }: { title: string; description: string; href: string; category: string; icon?: ReactNode }) {
  return (
    <Link className="vd-ui-tool-card" href={href}>
      <span className="vd-ui-tool-icon" aria-hidden="true">{icon}</span>
      <span className="vd-ui-tool-category">{category}</span>
      <strong>{title}</strong>
      <p>{description}</p>
      <span className="vd-ui-tool-link">Open tool <span aria-hidden="true">↗</span></span>
    </Link>
  );
}
