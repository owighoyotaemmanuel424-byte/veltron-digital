import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ProductCard = {
  title: string;
  category: string;
  description: string;
  status: "Request only" | "Setup required" | "Not enabled";
  count?: number;
  href: string;
  action: string;
};

export default async function ProductsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const [activeServices, hostedSites, documents, calls] = await Promise.all([
    prisma.service.count({ where: { status: "ACTIVE" } }),
    prisma.hostedSite.count({ where: { userId: user.id } }),
    prisma.generatedDocument.count({ where: { userId: user.id } }),
    prisma.telephonyLog.count({ where: { userId: user.id } }),
  ]);

  const products: ProductCard[] = [
    {
      title: "Digital services",
      category: "SERVICE CATALOG",
      description: "Browse the live catalog and submit an order request for services activated by the platform team. Requests remain pending until payment and fulfillment integrations are enabled.",
      status: activeServices > 0 ? "Request only" : "Setup required",
      count: activeServices,
      href: "/services",
      action: "Browse services",
    },
    {
      title: "Website creator",
      category: "WEBSITE ORCHESTRATOR",
      description: "Hosted-site records are available in your account. Automated deployment, template provisioning, and domain/DNS setup require a configured hosting and registrar provider.",
      status: "Setup required",
      count: hostedSites,
      href: "/dashboard",
      action: "View dashboard",
    },
    {
      title: "Document generator",
      category: "DOCUMENT TOOLS",
      description: "Your account can track generated-document records. Document creation and downloadable exports are not enabled yet. Financial documents must be clearly identified and must not imitate genuine third-party records.",
      status: "Not enabled",
      count: documents,
      href: "/dashboard",
      action: "View dashboard",
    },
    {
      title: "Call tools",
      category: "TELEPHONY",
      description: "Call activity records are supported, but live calling, provider callbacks, usage quotas, and billing need a selected compliant telephony provider and integration tests.",
      status: "Setup required",
      count: calls,
      href: "/dashboard",
      action: "View dashboard",
    },
    {
      title: "Wallet and billing",
      category: "PAYMENTS & LEDGER",
      description: "Wallet and ledger records are supported by the database. Top-ups, subscriptions, and balance-changing transactions remain disabled until payment verification, double-entry posting, and reconciliation are implemented.",
      status: "Not enabled",
      href: "/dashboard",
      action: "View wallet activity",
    },
  ];

  return (
    <main className="dashboard-page">
      <header className="topbar">
        <Link className="brand" href="/">veltron<span>.</span></Link>
        <nav className="nav">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/services">Services</Link>
          <Link href="/dashboard/security">Security</Link>
        </nav>
      </header>
      <section className="section" style={{ paddingTop: 36 }}>
        <div className="eyebrow">YOUR PRODUCT WORKSPACE</div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}>Products & tools</h1>
        <p className="lead">A transparent view of the product modules in Veltron Digital, what is currently usable, and what still needs provider setup.</p>
        <div className="cards">
          {products.map((product) => (
            <article className="card" key={product.title}>
              <div className="eyebrow">{product.category}</div>
              <div className="product-card-heading">
                <h2>{product.title}</h2>
                <span className={"product-status product-status-" + product.status.toLowerCase().replaceAll(" ", "-")}>{product.status}</span>
              </div>
              <p>{product.description}</p>
              {product.count !== undefined && <p className="product-count"><strong>{product.count}</strong> {product.title === "Digital services" ? "active catalog services" : product.title === "Website creator" ? "site records" : product.title === "Document generator" ? "document records" : "call records"} for your account</p>}
              <Link className="button secondary" href={product.href}>{product.action} <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </div>
        <div className="empty-state" style={{ marginTop: 24 }}>
          <h2>Before enabling transactions</h2>
          <p>Payment collection and automatic fulfillment must remain disabled until the provider credentials, signed callback validation, idempotency, reconciliation, and failure handling have been tested. Existing account and financial data are not modified by this overview.</p>
        </div>
      </section>
    </main>
  );
}
