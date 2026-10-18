import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import LogoutButton from "../logout-button";
import OrderHistoryTable from "./order-history-table";
import { PageHeading } from "@/components/veltron-ui";

export const dynamic = "force-dynamic";

function money(minor: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(minor / 100);
  } catch {
    return currency + " " + (minor / 100).toFixed(2);
  }
}

export default async function OrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    select: {
      publicId: true,
      status: true,
      quantity: true,
      totalMinor: true,
      currency: true,
      createdAt: true,
      updatedAt: true,
      service: { select: { name: true, category: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const counts = {
    all: orders.length,
    active: orders.filter((order) => ["PENDING", "PAID", "PROCESSING"].includes(order.status)).length,
    completed: orders.filter((order) => order.status === "COMPLETED").length,
    attention: orders.filter((order) => ["FAILED", "CANCELLED", "REFUNDED"].includes(order.status)).length,
  };

  return (
    <main className="workspace">
      <aside className="side-nav" aria-label="Workspace navigation">
        <Link className="brand" href="/">veltron<span>.</span></Link>
        <p className="side-label">WORKSPACE</p>
        <Link className="side-link" href="/dashboard"><span>◫ &nbsp; Overview</span><span aria-hidden="true">→</span></Link>
        <Link className="side-link active" href="/dashboard/orders" aria-current="page"><span>↗ &nbsp; Order history</span><span aria-hidden="true">↗</span></Link>
        <Link className="side-link" href="/services"><span>◇ &nbsp; Service catalog</span><span aria-hidden="true">→</span></Link>
        <Link className="side-link" href="/dashboard/security"><span>⌑ &nbsp; Account security</span><span aria-hidden="true">→</span></Link>
        <div className="side-bottom">
          <span className="side-foot">{user.email}</span>
          <LogoutButton />
        </div>
      </aside>

      <section className="workspace-main">
        <PageHeading eyebrow="Your activity" title="Order history." description="Track your requests and review order totals and statuses." action={{ label: "Browse services", href: "/services" }} />

        <section className="dashboard-grid dashboard-stats order-summary" aria-label="Order summary">
          <article className="dash-card"><span className="dash-label">Orders shown</span><strong>{counts.all}</strong><span className="dash-note">Most recent 100 orders</span></article>
          <article className="dash-card"><span className="dash-label">In progress</span><strong>{counts.active}</strong><span className="dash-note">Pending, paid, or processing</span></article>
          <article className="dash-card"><span className="dash-label">Completed</span><strong>{counts.completed}</strong><span className="dash-note">Successfully completed</span></article>
          <article className="dash-card"><span className="dash-label">Needs attention</span><strong>{counts.attention}</strong><span className="dash-note">Failed, cancelled, or refunded</span></article>
        </section>

        <section className="dash-section">
          <div className="section-heading">
            <div><div className="eyebrow">ACTIVITY LOG</div><h2>All recent orders</h2></div>
            <Link href="/dashboard" className="text-link">← Back to overview</Link>
          </div>
          <OrderHistoryTable orders={orders.map((order) => ({ ...order, createdAt: order.createdAt.toISOString() }))} />
          <p className="dash-note orders-disclaimer">This page shows the latest 100 orders. Order creation does not itself mean payment has settled or a service has been fulfilled.</p>
        </section>
      </section>
    </main>
  );
}
