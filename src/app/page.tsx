const features = [
  ["One clear workspace", "Discover services, manage requests, and review every order from one account."],
  ["Payments built for reconciliation", "Provider references, idempotency, and verified status transitions are first-class records."],
  ["Accountability by design", "Role-based administration and an audit trail support controlled operations."]
];
export default function Home() {
  return <main>
    <header className="topbar"><a className="brand" href="/">veltron<span>.</span></a><nav className="nav" aria-label="Main navigation"><a href="#services">Services</a><a href="#security">Security</a><a href="/sign-in">Sign in</a></nav></header>
    <section className="hero"><div><div className="eyebrow">A smarter service marketplace</div><h1>Move your next task forward.</h1><p className="lead">A streamlined place to discover services, place orders, and track progress — with clear payment records and accountable support.</p><div className="actions"><a className="button" href="/sign-up">Create account</a><a className="button secondary" href="#services">Explore services</a></div></div>
      <aside className="preview" aria-label="Platform feature preview"><div className="preview-head"><span>YOUR WORKSPACE</span><span>● Protected</span></div><div className="metric">All in one place.</div><div className="pills"><span className="pill">Order tracking</span><span className="pill">Payment history</span><span className="pill">Secure access</span></div><div style={{height:1,background:"#293244",margin:"24px 0"}}/><p className="lead">Designed around clarity: every order has a status, every payment has a reference, and privileged actions are auditable.</p></aside></section>
    <section className="section" id="services"><div className="eyebrow">Built for confidence</div><h2>Simple on the surface. Accountable underneath.</h2><div className="cards">{features.map(([title,body])=><article className="card" key={title}><h3>{title}</h3><p>{body}</p></article>)}</div></section>
    <section className="section" id="security"><div className="card"><div className="eyebrow">Integration status</div><h2>Paystack stays off until approved.</h2><p>Checkout is intentionally not activated until merchant eligibility is confirmed and production credentials are configured. Payment status must be reconciled against the provider before an order is fulfilled.</p></div></section>
    <footer className="footer">Veltron Digital · Original product concept · Secure by default</footer>
  </main>;
}
