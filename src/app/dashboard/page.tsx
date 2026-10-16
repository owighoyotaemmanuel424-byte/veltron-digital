import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./logout-button";

function money(minor: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(minor / 100);
  } catch {
    return currency + " " + (minor / 100).toFixed(2);
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

  const firstName = user.name?.trim().split(/\\s+/)[0];

  return (
    <main className="workspace">
      <aside className="side-nav" aria-label="Workspace navigation">
        <Link className="brand" href="/">veltron<span>.</span></Link>
        <p className="side-label">WORKSPACE</p>
        <Link className="side-link active" href="/dashboard" aria-current="page"><span>◫ &nbsp; Overview</span><span aria-hidden="true">↗</span></Link>
        <Link className="side-link" href="/services"><span>◇ &nbsp; Service catalog</span><span aria-hidden="true">→</span></Link>
        <Link className="side-link" href="/dashboard/security"><span>⌑ &nbsp; Account security</span><span aria-hidden="true">→</span></Link>
        <p className="side-label">YOUR ACTIVITY</p>
        <div className="side-link muted-link" aria-label={`Hosted sites, ${sites} records; section not yet available`}><span>Hosted sites <small className="coming-soon">Soon</small></span><small>{sites}</small></div>
        <div className="side-link muted-link" aria-label={`Documents, ${documents} records; section not yet available`}><span>Documents <small className="coming-soon">Soon</small></span><small>{documents}</small></div>
        <div className="side-link muted-link" aria-label={`Telephony history, ${calls} records; section not yet available`}><span>Telephony history <small className="coming-soon">Soon</small></span><small>{calls}</small></div>
        <div className="side-bottom">
          <span className="side-foot">{user.email}</span>
          <LogoutButton />
        </div>
      </aside>

      <section className="workspace-main">
        <header className="workspace-header">
          <div>
            <div className="eyebrow">CUSTOMER WORKSPACE</div>
            <h1>Good to see you{firstName ? `, ${firstName}` : ""}.</h1>
            <p className="lead">A clear view of your orders, wallet balances, and account protection.</p>
          </div>
          <span className="status-chip"><span className="status-dot" /> Account active</span>
        </header>

        <section className="dashboard-welcome" aria-label="Quick actions">
          <div>
            <span className="dash-label">YOUR NEXT STEP</span>
            <h2>What would you like to do?</h2>
            <p>Explore available services or strengthen your account security.</p>
          </div>
          <div className="dashboard-quick-actions">
            <Link className="button" href="/services">Browse services <span aria-hidden="true">↗</span></Link>
            <Link className="button secondary" href="/dashboard/security">Security settings <span aria-hidden="true">→</span></Link>
          </div>
        </section>

        <section className="dashboard-grid dashboard-stats" aria-label="Account summary">
          <article className="dash-card">
            <span className="dash-icon" aria-hidden="true">↗</span>
            <span className="dash-label">Total orders</span>
            <strong>{orders}</strong>
            <span className="dash-note">All-time requests</span>
          </article>
          <article className="dash-card">
            <span className="dash-icon dash-icon-blue" aria-hidden="true">◷</span>
            <span className="dash-label">In progress</span>
            <strong>{inProgress}</strong>
            <span className="dash-note">Pending, paid, or processing</span>
          </article>
          <article className="dash-card">
            <span className="dash-icon dash-icon-green" aria-hidden="true">✓</span>
            <span className="dash-label">Completed</span>
            <strong>{completed}</strong>
            <span className="dash-note">Successfully completed orders</span>
          </article>
          <article className="dash-card">
            <span className="dash-icon dash-icon-blue" aria-hidden="true">◈</span>
            <span className="dash-label">Wallet currencies</span>
            <strong>{accounts.length}</strong>
            <span className="dash-note">Account balances in PostgreSQL</span>
          </article>
          <article className="dash-card dash-security-card">
            <span className="dash-icon dash-icon-green" aria-hidden="true">⌑</span>
            <span className="dash-label">Two-factor authentication</span>
            <strong className="security-state">{user.twoFactorEnabled ? "Enabled" : "Not enabled"}</strong>
            <Link href="/dashboard/security" className="dash-note dash-action">Manage security →</Link>
          </article>
        </section>

        <section className="dash-section">
          <div className="section-heading">
            <div><div className="eyebrow">ACTIVITY</div><h2>Recent orders</h2></div>
            <Link href="/services" className="text-link">Explore services →</Link>
          </div>
          {recent.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Service</th><th>Order reference</th><th>Status</th><th>Total</th><th>Placed</th></tr></thead>
                <tbody>
                  {recent.map((order) => (
                    <tr key={order.publicId}>
                      <td>{order.service.name}</td>
                      <td><span className="order-reference">{order.publicId.slice(0, 12)}</span></td>
                      <td><span className={`table-status status-${order.status.toLowerCase()}`}>{order.status.toLowerCase().replaceAll("_", " ")}</span></td>
                      <td>{money(order.totalMinor, order.currency)}</td>
                      <td>{order.createdAt.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-mark">↗</div>
              <h3>Your workspace is ready</h3>
              <p>Your order history will appear here after you place your first request. Browse the live catalog to see what is currently available.</p>
              <Link href="/services" className="button">Browse services <span aria-hidden="true">↗</span></Link>
            </div>
          )}
        </section>

        <section className="dash-section">
          <div className="section-heading">
            <div><div className="eyebrow">WALLET</div><h2>Your balances</h2></div>
            <span className="dash-note">Read-only overview</span>
          </div>
          {accounts.length ? (
            <div className="dashboard-grid wallet-grid">
              {accounts.map((account) => (
                <article className="dash-card wallet-card" key={account.currency}>
                  <span className="dash-label">{account.currency} wallet</span>
                  <strong>{money(account.balanceMinor, account.currency)}</strong>
                  <span className="dash-note">Available ledger balance</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state compact">
              <h3>No wallets yet</h3>
              <p>A wallet will appear here when one is created for your account. Funding and transfers remain unavailable until payment reconciliation and ledger posting are implemented and tested.</p>
            </div>
          )}
        </section>

        <footer className="dashboard-footer">
          <span>Veltron Digital · Your workspace</span>
          <Link href="/dashboard/security">Review account security →</Link>
        </footer>
      </section>
    </main>
  );
}
