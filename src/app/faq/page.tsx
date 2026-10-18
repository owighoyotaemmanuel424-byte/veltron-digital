import Link from "next/link";

const groups = [
  {
    title: "Getting started",
    items: [
      ["What is Veltron Digital?", "Veltron Digital is a workspace for discovering available digital services, managing website drafts, and keeping track of orders and account activity."],
      ["How do I find available services?", "Open the Service Catalog. It lists services that have been activated in the platform. If the catalog is empty, that means no services are currently enabled for ordering."],
      ["Do I need an account?", "You can explore public information without signing in. A Veltron account is required for private workspace features such as your orders, website drafts, and account security."],
    ],
  },
  {
    title: "Websites and documents",
    items: [
      ["Can I publish a website directly from Website Creator?", "The current creator supports private drafts and editing/preview workflows. Public hosting, custom-domain setup, DNS, and SSL require additional provider integrations and should not be considered available until explicitly enabled."],
      ["What are document drafts for?", "Document drafts support legitimate recordkeeping and clearly labelled samples. A draft or sample must not be presented as a genuine bank statement, payment confirmation, or transaction record."],
    ],
  },
  {
    title: "Payments and subscriptions",
    items: [
      ["Can I top up a Veltron wallet today?", "Wallet top-ups are not enabled until an approved payment provider and the complete signed-webhook, idempotency, ledger, and reconciliation flow have been configured and tested. Do not treat a displayed balance as proof of a payment."],
      ["Are subscription plans available?", "Subscription billing is not configured yet. The platform should show plan purchase options only after pricing, checkout, and access entitlements have been implemented and verified."],
      ["What happens if a service is not listed?", "Only activated catalog entries are offered for ordering. Other integrations may be planned, but they should not be treated as live services."],
    ],
  },
  {
    title: "Account and security",
    items: [
      ["How do I protect my account?", "Use a unique password, keep your sign-in details private, sign out on shared devices, and review the Account Security page for the controls currently available to your account."],
      ["Can I ask for help with an order?", "Start from your order details and retain the order reference and any provider payment reference. A dedicated support-ticket workflow should be treated as available only once it is connected to the platform."],
    ],
  },
];

export default function FAQPage() {
  return (
    <main>
      <header className="topbar">
        <Link className="brand" href="/">veltron<span>.</span></Link>
        <nav className="nav" aria-label="Main navigation">
          <Link href="/services">Services</Link>
          <Link href="/sign-in">Sign in</Link>
          <Link href="/sign-up">Get started</Link>
        </nav>
      </header>
      <section className="section" style={{ paddingTop: 54, maxWidth: 980 }}>
        <div className="eyebrow">HELP CENTER</div>
        <h1 style={{ fontSize: "clamp(38px, 6vw, 58px)", maxWidth: 760 }}>Clear answers. No guesswork.</h1>
        <p className="lead">Learn how the Veltron workspace works, what is currently available, and which services still need provider setup.</p>
        <div style={{ display: "grid", gap: 30, marginTop: 38 }}>
          {groups.map((group) => (
            <section key={group.title} aria-labelledby={group.title.replace(/\\s+/g, "-").toLowerCase()}>
              <h2 id={group.title.replace(/\\s+/g, "-").toLowerCase()} style={{ fontSize: 22, marginBottom: 14 }}>{group.title}</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {group.items.map(([question, answer]) => (
                  <details key={question} className="card" style={{ padding: "18px 20px" }}>
                    <summary style={{ cursor: "pointer", fontWeight: 700, lineHeight: 1.5 }}>{question}</summary>
                    <p style={{ color: "var(--muted)", lineHeight: 1.75, marginBottom: 0 }}>{answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="card" style={{ marginTop: 38 }}>
          <h2 style={{ marginTop: 0 }}>Ready to continue?</h2>
          <p>Browse the live catalog or return to your workspace.</p>
          <div className="actions">
            <Link className="button" href="/services">Browse services</Link>
            <Link className="button secondary" href="/dashboard">Open dashboard</Link>
          </div>
        </div>
      </section>
      <footer className="footer">© {new Date().getFullYear()} Veltron Digital · Clear services, careful handling.</footer>
    </main>
  );
}
