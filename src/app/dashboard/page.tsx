import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./logout-button";
import styles from "./dashboard.module.css";

export const dynamic = "force-dynamic";

function money(minor: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(minor / 100);
  } catch {
    return currency + " " + (minor / 100).toFixed(2);
  }
}

function statusClass(status: string) {
  switch (status) {
    case "COMPLETED":
    case "SUCCESS": return styles.statuscompleted;
    case "PROCESSING":
    case "PAID": return styles.statusprocessing;
    case "PENDING":
    case "INITIALIZED": return styles.statuspending;
    case "FAILED":
    case "CANCELLED":
    case "REVERSED":
    case "REFUNDED": return styles.statusfailed;
    default: return "";
  }
}

function categoryLabel(category: string) {
  return category.trim() || "Other services";
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const [orders, inProgress, completed, accounts, recentOrders, sites, documents, calls, services, ledgerTransactions, payments] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.order.count({ where: { userId: user.id, status: { in: ["PENDING", "PAID", "PROCESSING"] } } }),
    prisma.order.count({ where: { userId: user.id, status: "COMPLETED" } }),
    prisma.walletAccount.findMany({
      where: { userId: user.id },
      select: { currency: true, balanceMinor: true },
      orderBy: { currency: "asc" },
    }),
    prisma.order.findMany({
      where: { userId: user.id },
      select: { publicId: true, status: true, totalMinor: true, currency: true, createdAt: true, service: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.hostedSite.count({ where: { userId: user.id } }),
    prisma.generatedDocument.count({ where: { userId: user.id } }),
    prisma.telephonyLog.count({ where: { userId: user.id } }),
    prisma.service.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, slug: true, name: true, description: true, category: true, priceMinor: true, currency: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.ledgerTransaction.findMany({
      where: { entries: { some: { account: { userId: user.id } } } },
      select: {
        id: true, reference: true, description: true, createdAt: true,
        entries: { where: { account: { userId: user.id } }, select: { amountMinor: true, currency: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.payment.findMany({
      where: { userId: user.id },
      select: { provider: true, providerReference: true, status: true, amountMinor: true, currency: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const firstName = user.name?.trim().split(/\s+/)[0];
  const initials = (user.name?.trim() || user.email).slice(0, 1).toUpperCase();
  const primaryAccount = accounts.find((account) => account.currency === "NGN") || accounts[0];
  const groupedServices = services.reduce<Record<string, typeof services>>((groups, service) => {
    const category = categoryLabel(service.category);
    (groups[category] ||= []).push(service);
    return groups;
  }, {});
  const serviceGroups = Object.entries(groupedServices);
  const totalWalletMinor = primaryAccount?.balanceMinor ?? 0;

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar} aria-label="Workspace navigation">
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>v</span>
          Veltron<span>Digital</span>
        </Link>

        <p className={styles.groupLabel}>YOUR WORKSPACE</p>
        <Link className={`${styles.navLink} ${styles.active}`} href="/dashboard" aria-current="page"><span className={styles.navIcon}>◫</span>Dashboard</Link>
        <Link className={styles.navLink} href="/dashboard/orders"><span className={styles.navIcon}>↗</span>My orders</Link>
        <Link className={styles.navLink} href="/services"><span className={styles.navIcon}>◇</span>Browse services</Link>
        <Link className={styles.navLink} href="/dashboard/security"><span className={styles.navIcon}>⌑</span>Account security</Link>

        <p className={styles.groupLabel}>TOOLS & ACTIVITY</p>
        <div className={styles.navLink} aria-label={`Website creator records: ${sites}; feature availability depends on services`}><span className={styles.navIcon}>▧</span>Website creator <small className={styles.coming}>{sites}</small></div>
        <div className={styles.navLink} aria-label={`Document tool records: ${documents}`}><span className={styles.navIcon}>▤</span>Documents <small className={styles.coming}>{documents}</small></div>
        <div className={styles.navLink} aria-label={`Telephony records: ${calls}`}><span className={styles.navIcon}>⌁</span>Call tools <small className={styles.coming}>{calls}</small></div>

        <div className={styles.sidebarBottom}>
          <div className={styles.profile}>
            <span className={styles.avatar}>{initials}</span>
            <span className={styles.profileText}>
              <strong>{user.name?.trim() || "Veltron member"}</strong>
              <small>{user.email}</small>
            </span>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <section className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}><span>Workspace</span><span>/</span><b>Dashboard</b></div>
          <div className={styles.topActions}>
            <Link className={styles.helpLink} href="#quick-actions">Take the tour ↓</Link>
            <span className={styles.status}><span className={styles.statusDot} />Account active</span>
          </div>
        </header>

        <header className={styles.heading}>
          <div>
            <div className={styles.kicker}>YOUR ACCOUNT AT A GLANCE</div>
            <h1>Welcome{firstName ? `, ${firstName}` : ""}.</h1>
            <p>Your wallet, services, and recent activity in one place.</p>
          </div>
          <div className={styles.headingAction}>
            <Link className={`${styles.button} ${styles.buttonSecondary}`} href="/dashboard/security">Manage account <span aria-hidden="true">→</span></Link>
            <Link className={styles.button} href="/services">Explore services <span aria-hidden="true">↗</span></Link>
          </div>
        </header>

        <section className={styles.heroCard} aria-label="Wallet overview">
          <div className={styles.heroTitle}>
            <div className={styles.overline}><span>✦</span> YOUR VELTRON WORKSPACE</div>
            <h2>Everything you need, all in one dashboard.</h2>
            <p>Discover available tools, review your wallet balance, and follow your recent orders and payments from one secure account.</p>
            <div className={styles.heroButtons}>
              <Link className={styles.button} href="/services">Browse services <span aria-hidden="true">↗</span></Link>
              <Link className={`${styles.button} ${styles.buttonSecondary}`} href="/dashboard/orders">View my orders <span aria-hidden="true">→</span></Link>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.visualHead}><span>WALLET BALANCE</span><strong>{primaryAccount?.currency || "WALLET"}</strong></div>
            <div className={styles.visualBalance}>Available ledger balance</div>
            <div className={styles.visualAmount}>{primaryAccount ? money(totalWalletMinor, primaryAccount.currency) : "No wallet yet"}</div>
            <div className={styles.visualFoot}><span>{accounts.length} wallet {accounts.length === 1 ? "currency" : "currencies"}</span><b>Account overview</b></div>
          </div>
        </section>

        <section className={styles.metrics} aria-label="Account summary">
          <article className={styles.metric}><div className={styles.metricTop}><span>Wallet balance</span><span className={styles.metricIcon}>₦</span></div><strong className={styles.metricValue}>{primaryAccount ? money(totalWalletMinor, primaryAccount.currency) : "—"}</strong><span className={styles.metricNote}>{primaryAccount?.currency || "No wallet created"}</span></article>
          <article className={styles.metric}><div className={styles.metricTop}><span>Active plan</span><span className={styles.metricIcon}>◇</span></div><strong className={styles.metricValue}>{orders > 0 ? "—" : "None"}</strong><span className={styles.metricNote}>Subscription plans are not configured</span></article>
          <article className={styles.metric}><div className={styles.metricTop}><span>Recent payments</span><span className={styles.metricIcon}>↗</span></div><strong className={styles.metricValue}>{payments.length}</strong><span className={styles.metricNote}>Latest {payments.length} payment records</span></article>
          <article className={styles.metric}><div className={styles.metricTop}><span>My orders</span><span className={styles.metricIcon}>▤</span></div><strong className={styles.metricValue}>{orders}</strong><span className={styles.metricNote}>{inProgress} in progress · {completed} completed</span></article>
        </section>

        <section className={styles.quickSection} id="quick-actions">
          <div className={styles.sectionIntro}>
            <div><div className={styles.kicker}>GET STARTED</div><h2>Quick actions</h2><p>Shortcuts to the services currently available in Veltron Digital.</p></div>
            <Link className={styles.textLink} href="/services">View all services ↗</Link>
          </div>
          {serviceGroups.length ? serviceGroups.map(([category, items]) => (
            <section className={styles.actionGroup} key={category}>
              <div className={styles.actionGroupTitle}><h3>{category}</h3><span>{items.length} {items.length === 1 ? "service" : "services"}</span></div>
              <div className={styles.actionGrid}>
                {items.slice(0, 8).map((service, index) => (
                  <Link className={styles.actionTile} href="/services" key={service.id}>
                    <span className={styles.actionTileIcon}>{["◇", "↗", "▤", "✦", "⌁", "◈", "▧", "＋"][index % 8]}</span>
                    <span className={styles.actionTileText}><strong>{service.name}</strong><small>{service.description}</small></span>
                    <span className={styles.actionArrow}>↗</span>
                  </Link>
                ))}
              </div>
            </section>
          )) : (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>◇</span><h3>No active services yet</h3>
              <p>The service catalog is ready to display activated services here. Nothing is listed until a service is enabled by the platform.</p>
              <Link className={styles.button} href="/services">Open service catalog ↗</Link>
            </div>
          )}
        </section>

        <div className={styles.activityGrid}>
          <section className={styles.panel}>
            <div className={styles.panelHead}><div><div className={styles.kicker}>WALLET ACTIVITY</div><h2>Recent wallet transactions</h2></div><span className={styles.panelCount}>{ledgerTransactions.length} records</span></div>
            {ledgerTransactions.length ? <div className={styles.tableWrap}><table className={styles.table}>
              <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Reference</th></tr></thead>
              <tbody>{ledgerTransactions.map((transaction) => {
                const amount = transaction.entries.reduce((sum, entry) => sum + entry.amountMinor, 0);
                const currency = transaction.entries[0]?.currency || primaryAccount?.currency || "NGN";
                return <tr key={transaction.id}>
                  <td>{transaction.createdAt.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}</td>
                  <td><div className={styles.serviceCell}><strong>{transaction.description}</strong><small>Ledger transaction</small></div></td>
                  <td className={amount >= 0 ? styles.amountPositive : styles.amountNegative}>{money(amount, currency)}</td>
                  <td><span className={styles.reference}>{transaction.reference.slice(0, 12)}</span></td>
                </tr>;
              })}</tbody>
            </table></div> : <div className={styles.empty}><span className={styles.emptyIcon}>↔</span><h3>No wallet transactions yet</h3><p>Ledger activity will appear here when transactions are recorded for your wallet.</p></div>}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}><div><div className={styles.kicker}>PAYMENT HISTORY</div><h2>Recent payments</h2></div><span className={styles.panelCount}>{payments.length} records</span></div>
            {payments.length ? <div className={styles.tableWrap}><table className={styles.table}>
              <thead><tr><th>Date / provider</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>{payments.map((payment) => <tr key={payment.providerReference}>
                <td><div className={styles.serviceCell}><strong>{payment.provider}</strong><small>{payment.createdAt.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}</small></div></td>
                <td>{money(payment.amountMinor, payment.currency)}</td>
                <td><span className={`${styles.badge} ${statusClass(payment.status)}`}>{payment.status.toLowerCase().replaceAll("_", " ")}</span></td>
              </tr>)}</tbody>
            </table></div> : <div className={styles.empty}><span className={styles.emptyIcon}>↗</span><h3>No payments recorded</h3><p>Payment records appear here when a checkout is initiated and stored against your account.</p></div>}
          </section>
        </div>

        <section className={styles.panel + " " + styles.orderPanel}>
          <div className={styles.panelHead}><div><div className={styles.kicker}>SERVICE ACTIVITY</div><h2>Recent orders</h2></div><Link className={styles.textLink} href="/dashboard/orders">View all orders ↗</Link></div>
          {recentOrders.length ? <div className={styles.tableWrap}><table className={styles.table}>
            <thead><tr><th>Service</th><th>Reference</th><th>Status</th><th>Total</th><th>Date</th></tr></thead>
            <tbody>{recentOrders.map((order) => <tr key={order.publicId}>
              <td><div className={styles.serviceCell}><strong>{order.service.name}</strong><small>Service order</small></div></td>
              <td><span className={styles.reference}>{order.publicId.slice(0, 12)}</span></td>
              <td><span className={`${styles.badge} ${statusClass(order.status)}`}>{order.status.toLowerCase().replaceAll("_", " ")}</span></td>
              <td>{money(order.totalMinor, order.currency)}</td>
              <td>{order.createdAt.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}</td>
            </tr>)}</tbody>
          </table></div> : <div className={styles.empty}><span className={styles.emptyIcon}>↗</span><h3>No orders yet</h3><p>When you submit an order for an active service, its status and total will appear here.</p><Link className={styles.button} href="/services">Explore services ↗</Link></div>}
        </section>

        <section className={styles.securityPanel}>
          <div className={styles.securityRow}><span className={styles.securityIcon}>⌑</span><div><strong>Account protection</strong><p>Two-factor authentication is {user.twoFactorEnabled ? "enabled" : "not enabled"} on your account.</p></div></div>
          <Link className={styles.securityLink} href="/dashboard/security">Review security settings →</Link>
        </section>

        <footer className={styles.footer}><span>Veltron Digital · Your workspace</span><span>{orders} total orders · {accounts.length} wallet currencies</span><Link href="/dashboard/security">Account security →</Link></footer>
      </section>
    </main>
  );
}
