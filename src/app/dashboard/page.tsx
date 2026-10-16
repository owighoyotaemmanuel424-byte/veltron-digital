import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./logout-button";
import styles from "./dashboard.module.css";

function money(minor: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(minor / 100);
  } catch {
    return currency + " " + (minor / 100).toFixed(2);
  }
}

function statusClass(status: string) {
  switch (status) {
    case "COMPLETED": return styles.statuscompleted;
    case "PROCESSING": return styles.statusprocessing;
    case "PAID": return styles.statuspaid;
    case "PENDING": return styles.statuspending;
    case "FAILED": return styles.statusfailed;
    case "CANCELLED": return styles.statuscancelled;
    case "REFUNDED": return styles.statusrefunded;
    default: return "";
  }
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const [orders, inProgress, completed, accounts, recent, sites, documents, calls] = await Promise.all([
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
      select: {
        publicId: true,
        status: true,
        totalMinor: true,
        currency: true,
        createdAt: true,
        service: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.hostedSite.count({ where: { userId: user.id } }),
    prisma.generatedDocument.count({ where: { userId: user.id } }),
    prisma.telephonyLog.count({ where: { userId: user.id } }),
  ]);

  const firstName = user.name?.trim().split(/\s+/)[0];
  const initials = (user.name?.trim() || user.email).slice(0, 1).toUpperCase();
  const primaryAccount = accounts[0];

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar} aria-label="Workspace navigation">
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>v</span>
          Veltron<span>Digital</span>
        </Link>

        <p className={styles.groupLabel}>YOUR WORKSPACE</p>
        <Link className={`${styles.navLink} ${styles.active}`} href="/dashboard" aria-current="page"><span className={styles.navIcon}>◫</span>Overview</Link>
        <Link className={styles.navLink} href="/dashboard/orders"><span className={styles.navIcon}>↗</span>Order history</Link>
        <Link className={styles.navLink} href="/services"><span className={styles.navIcon}>◇</span>Explore services</Link>
        <Link className={styles.navLink} href="/dashboard/security"><span className={styles.navIcon}>⌑</span>Security & access</Link>

        <p className={styles.groupLabel}>MORE TOOLS</p>
        <div className={styles.navLink} aria-label={`Website creator, ${sites} records; coming soon`}><span className={styles.navIcon}>▧</span>Website creator <small className={styles.coming}>Soon</small></div>
        <div className={styles.navLink} aria-label={`Document tools, ${documents} records; coming soon`}><span className={styles.navIcon}>▤</span>Document tools <small className={styles.coming}>Soon</small></div>
        <div className={styles.navLink} aria-label={`AI telephony, ${calls} records; coming soon`}><span className={styles.navIcon}>⌁</span>AI telephony <small className={styles.coming}>Soon</small></div>

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
          <div className={styles.breadcrumb}><span>Workspace</span><span>/</span><b>Overview</b></div>
          <div className={styles.topActions}>
            <Link className={styles.helpLink} href="/services">Explore tools ↗</Link>
            <span className={styles.status}><span className={styles.statusDot} />Account active</span>
          </div>
        </header>

        <header className={styles.heading}>
          <div>
            <div className={styles.kicker}>YOUR DIGITAL WORKSPACE</div>
            <h1>Welcome back{firstName ? `, ${firstName}` : ""}.</h1>
            <p>Your services, account activity, and balances — all in one place.</p>
          </div>
          <div className={styles.headingAction}>
            <Link className={`${styles.button} ${styles.buttonSecondary}`} href="/dashboard/security">Manage account <span aria-hidden="true">→</span></Link>
            <Link className={styles.button} href="/services">Browse services <span aria-hidden="true">↗</span></Link>
          </div>
        </header>

        <section className={styles.heroCard} aria-label="Wallet overview">
          <div className={styles.heroTitle}>
            <div className={styles.overline}><span>✦</span> ONE ACCOUNT. MORE POSSIBILITIES.</div>
            <h2>Your digital operations, simplified.</h2>
            <p>Discover available services, keep track of your requests, and manage your account from one secure workspace.</p>
            <div className={styles.heroButtons}>
              <Link className={styles.button} href="/services">Explore the catalog <span aria-hidden="true">↗</span></Link>
              <Link className={`${styles.button} ${styles.buttonSecondary}`} href="/dashboard/orders">View activity <span aria-hidden="true">→</span></Link>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.visualHead}><span>WALLET OVERVIEW</span><strong>{primaryAccount?.currency || "ACCOUNT"}</strong></div>
            <div className={styles.visualBalance}>Available ledger balance</div>
            <div className={styles.visualAmount}>{primaryAccount ? money(primaryAccount.balanceMinor, primaryAccount.currency) : "Not available"}</div>
            <div className={styles.visualFoot}><span>{accounts.length} wallet {accounts.length === 1 ? "currency" : "currencies"}</span><b>Live account data</b></div>
          </div>
        </section>

        <section className={styles.metrics} aria-label="Account summary">
          <article className={styles.metric}>
            <div className={styles.metricTop}><span>Total orders</span><span className={styles.metricIcon}>↗</span></div>
            <strong className={styles.metricValue}>{orders}</strong>
            <span className={styles.metricNote}>All-time service requests</span>
          </article>
          <article className={styles.metric}>
            <div className={styles.metricTop}><span>In progress</span><span className={styles.metricIcon}>◷</span></div>
            <strong className={styles.metricValue}>{inProgress}</strong>
            <span className={styles.metricNote}>Awaiting completion</span>
          </article>
          <article className={styles.metric}>
            <div className={styles.metricTop}><span>Completed</span><span className={styles.metricIcon}>✓</span></div>
            <strong className={styles.metricValue}>{completed}</strong>
            <span className={styles.metricNote}>Successfully completed</span>
          </article>
          <article className={styles.metric}>
            <div className={styles.metricTop}><span>Wallet currencies</span><span className={styles.metricIcon}>◈</span></div>
            <strong className={styles.metricValue}>{accounts.length}</strong>
            <span className={styles.metricNote}>Wallets linked to your account</span>
          </article>
        </section>

        <div className={styles.contentGrid}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div><div className={styles.kicker}>LATEST ACTIVITY</div><h2>Recent orders</h2></div>
              <Link className={styles.textLink} href="/dashboard/orders">View all orders ↗</Link>
            </div>
            {recent.length ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Service</th><th>Reference</th><th>Status</th><th>Total</th><th>Date</th></tr></thead>
                  <tbody>
                    {recent.map((order) => (
                      <tr key={order.publicId}>
                        <td><div className={styles.serviceCell}><strong>{order.service.name}</strong><small>Service order</small></div></td>
                        <td><span className={styles.reference}>{order.publicId.slice(0, 12)}</span></td>
                        <td><span className={`${styles.badge} ${statusClass(order.status)}`}>{order.status.toLowerCase().replaceAll("_", " ")}</span></td>
                        <td>{money(order.totalMinor, order.currency)}</td>
                        <td>{order.createdAt.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>↗</span>
                <h3>Your next step starts here</h3>
                <p>You haven’t placed an order yet. Explore the available service catalog and your orders will appear here as you get started.</p>
                <Link className={styles.button} href="/services">Browse services ↗</Link>
              </div>
            )}
          </section>

          <div>
            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div><div className={styles.kicker}>YOUR FINANCES</div><h2>Wallet balances</h2></div>
                <small>Read only</small>
              </div>
              {accounts.length ? (
                <div className={styles.walletList}>
                  {accounts.map((account) => (
                    <div className={styles.walletItem} key={account.currency}>
                      <div className={styles.walletLeft}>
                        <span className={styles.currencyMark}>{account.currency.slice(0, 3)}</span>
                        <span className={styles.walletText}><strong>{account.currency} wallet</strong><small>Available ledger balance</small></span>
                      </div>
                      <strong className={styles.walletAmount}>{money(account.balanceMinor, account.currency)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon}>◈</span>
                  <h3>No wallet available</h3>
                  <p>A wallet balance will appear here once a wallet has been created for your account.</p>
                </div>
              )}
            </section>

            <section className={styles.securityPanel}>
              <div className={styles.securityRow}>
                <span className={styles.securityIcon}>⌑</span>
                <div><strong>Account protection</strong><p>Two-factor authentication is {user.twoFactorEnabled ? "enabled" : "not enabled"} on your account.</p></div>
              </div>
              <Link className={styles.securityLink} href="/dashboard/security">Review security settings →</Link>
            </section>
          </div>
        </div>

        <footer className={styles.footer}>
          <span>Veltron Digital · Your workspace</span>
          <span>{orders} total orders · {accounts.length} wallet currencies</span>
          <Link href="/dashboard/security">Account security →</Link>
        </footer>
      </section>
    </main>
  );
}
