import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ServiceCatalog from "./service-catalog";
import { EmptyState, PageHeading } from "@/components/veltron-ui";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  let services: { id: string; name: string; description: string; category: string; priceMinor: number; currency: string }[] = [];
  let unavailable = false;
  try {
    services = await prisma.service.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, description: true, category: true, priceMinor: true, currency: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
  } catch {
    unavailable = true;
  }

  return <main>
    <header className="topbar">
      <Link className="brand" href="/">veltron<span>.</span></Link>
      <nav className="nav"><Link href="/dashboard">Dashboard</Link><Link href="/sign-in">Sign in</Link></nav>
    </header>
    <section className="section" style={{ paddingTop: 48 }}>
      <PageHeading eyebrow="Service catalog" title="Find your next service." description="Browse the active catalog, compare service details, and place a request from one clear workspace." action={{ label: "Open dashboard", href: "/dashboard" }} />
      {unavailable ? <EmptyState title="Catalog temporarily unavailable" description="The service catalog could not be loaded. Check the database configuration and try again." />
        : services.length ? <ServiceCatalog services={services} />
        : <EmptyState title="No active services yet" description="The catalog is connected, but no services have been activated." action={{ label: "Go to dashboard", href: "/dashboard" }} />}
    </section>
  </main>;
}
