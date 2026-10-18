import Link from "next/link";

const highlights = [
  { number: "01", title: "Find what you need", body: "Browse a clear service catalog and understand the request before you place it.", icon: "⌕" },
  { number: "02", title: "Stay in control", body: "Keep your requests, order status, and account details together in one workspace.", icon: "↗" },
  { number: "03", title: "Know where things stand", body: "Follow status updates and review payment references without guessing.", icon: "✓" },
];

const serviceTypes = [
  { icon: "▦", title: "Website Creator", description: "Create, edit, and preview your website drafts from one workspace.", tone: "violet", href: "/dashboard/sites", eyebrow: "BUILD" },
  { icon: "↗", title: "Orders & tracking", description: "Review requests, follow their current status, and keep your activity organized.", tone: "blue", href: "/dashboard/orders", eyebrow: "TRACK" },
  { icon: "◇", title: "Service catalog", description: "Browse the live catalog and see only services that have been activated.", tone: "mint", href: "/services", eyebrow: "EXPLORE" },
  { icon: "▤", title: "Document drafts", description: "Manage document drafts for legitimate recordkeeping and clearly labelled samples.", tone: "violet", href: "/dashboard/documents", eyebrow: "CREATE" },
  { icon: "⌑", title: "Account security", description: "Review account protection options and manage your security settings.", tone: "blue", href: "/dashboard/security", eyebrow: "PROTECT" },
  { icon: "⌘", title: "Products & tools", description: "See the tools available in your account and their current setup status.", tone: "mint", href: "/dashboard/products", eyebrow: "MANAGE" },
];

export default function Home() {
  return (
    <main className="vd-page">
      <div className="vd-announcement"><span className="vd-announcement-pulse" /> <strong>VELTRON DIGITAL</strong><span>One workspace for your digital tools</span><Link href="/faq">Explore what’s available <span aria-hidden="true">↗</span></Link></div>
      <header className="vd-header">
        <Link className="vd-brand" href="/" aria-label="Veltron Digital home">
          <span className="vd-brand-mark">v</span><span>veltron<span className="vd-brand-dot">.</span></span>
        </Link>
        <nav className="vd-nav" aria-label="Main navigation">
          <Link href="#services">Explore</Link>
          <Link href="#how-it-works">How it works</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="#trust">Our approach</Link>
        </nav>
        <div className="vd-header-actions">
          <Link className="vd-signin" href="/sign-in">Sign in</Link>
          <Link className="vd-header-cta" href="/sign-up">Get started <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <section className="vd-hero">
        <div className="vd-hero-glow" aria-hidden="true" />
        <div className="vd-hero-copy">
          <div className="vd-kicker"><span className="vd-kicker-dot" /> YOUR DIGITAL WORKSPACE, REIMAGINED</div>
          <h1>Make digital<br />work feel <span>effortless.</span></h1>
          <p className="vd-hero-lead">One thoughtful place to discover services, manage requests, and follow progress — without losing track of the details.</p>
          <div className="vd-hero-actions">
            <Link className="vd-button vd-button-primary" href="/sign-up">Create your account <span aria-hidden="true">↗</span></Link>
            <Link className="vd-button vd-button-quiet" href="/services">Explore services <span aria-hidden="true">→</span></Link>
          </div>
          <div className="vd-social-proof">
            <div className="vd-avatar-stack" aria-hidden="true"><span>V</span><span>D</span><span>+</span></div>
            <div><strong>Everything in one place</strong><small>Clear requests. Organized activity. More control.</small></div>
          </div>
        </div>

        <div className="vd-product-visual" aria-label="Illustration of the Veltron workspace">
          <div className="vd-orbit vd-orbit-one" aria-hidden="true" />
          <div className="vd-orbit vd-orbit-two" aria-hidden="true" />
          <div className="vd-float-tag vd-float-tag-top"><span className="vd-live-dot" /> Your workspace</div>
          <div className="vd-dashboard-card">
            <div className="vd-dash-top"><div><span className="vd-mini-label">OVERVIEW</span><h2>Your activity</h2></div><span className="vd-window-dots" aria-hidden="true">•••</span></div>
            <div className="vd-activity-highlight"><div className="vd-activity-icon">↗</div><div><small>Stay on top of every request</small><strong>One clear view</strong></div><span className="vd-arrow-circle">↗</span></div>
            <div className="vd-chart-wrap" aria-hidden="true">
              <div className="vd-chart-grid"><i /><i /><i /><i /></div>
              <svg className="vd-chart" viewBox="0 0 440 120" role="img" aria-label="Decorative rising activity line"><defs><linearGradient id="vd-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9a8cff" stopOpacity=".32" /><stop offset="100%" stopColor="#9a8cff" stopOpacity="0" /></linearGradient></defs><path d="M0 100 C25 92 36 99 58 78 S95 83 116 64 S153 78 176 53 S211 61 232 45 S269 56 290 28 S331 48 354 26 S397 35 440 5 L440 120 L0 120 Z" fill="url(#vd-chart-fill)" /><path d="M0 100 C25 92 36 99 58 78 S95 83 116 64 S153 78 176 53 S211 61 232 45 S269 56 290 28 S331 48 354 26 S397 35 440 5" fill="none" stroke="#a99cff" strokeWidth="3" strokeLinecap="round" /></svg>
            </div>
            <div className="vd-chart-legend"><span><i /> Activity overview</span><span>Built around clarity</span></div>
            <div className="vd-dash-divider" />
            <div className="vd-lower-row"><div><span className="vd-mini-label">YOUR NEXT STEP</span><strong>Pick a service</strong></div><span className="vd-lower-icon">↗</span></div>
          </div>
          <div className="vd-float-tag vd-float-tag-bottom"><span className="vd-check-mark">✓</span><span><strong>Keep it organized</strong><small>Requests, status and history</small></span></div>
        </div>
        <div className="vd-hero-footnote"><span>DESIGNED FOR CLARITY</span><span className="vd-footnote-line" /><span>MADE TO MOVE WITH YOU</span></div>
      </section>

      <section className="vd-tools-intro" aria-label="Platform overview">
        <div className="vd-tools-intro-copy"><span className="vd-tools-overline">ONE ACCOUNT · CONNECTED WORKFLOWS</span><h2>Build, organize, and manage.<br /><span>All from one place.</span></h2></div>
        <div className="vd-tools-intro-note"><span className="vd-tools-status"><i /> WORKSPACE OVERVIEW</span><p>Explore website drafts, service requests, documents, and account tools in one consistent workspace. Availability is shown clearly before you take action.</p></div>
        <div className="vd-tools-rail">
          <Link href="/dashboard/sites"><span className="vd-tool-symbol">▧</span><span><strong>Website Creator</strong><small>Design & preview</small></span><b>↗</b></Link>
          <Link href="/services"><span className="vd-tool-symbol">◇</span><span><strong>Digital services</strong><small>Browse catalog</small></span><b>↗</b></Link>
          <Link href="/dashboard/orders"><span className="vd-tool-symbol">↗</span><span><strong>Orders & activity</strong><small>Track progress</small></span><b>↗</b></Link>
          <Link href="/dashboard/security"><span className="vd-tool-symbol">⌑</span><span><strong>Account security</strong><small>Protect access</small></span><b>↗</b></Link>
        </div>
      </section>

      <section className="vd-service-section" id="services">
        <div className="vd-section-heading">
          <div><div className="vd-kicker">A BETTER WAY TO GET THINGS DONE</div><h2>Less friction.<br /><span>More forward motion.</span></h2></div>
          <p>Everything starts with a simpler experience: know what is available, submit a request, and keep track as it moves forward.</p>
        </div>
        <div className="vd-service-grid">
          {serviceTypes.map((service, index) => <article className={`vd-service-card vd-${service.tone}`} key={service.title}><div className="vd-service-icon" aria-hidden="true">{service.icon}</div><span className="vd-card-index">VELTRON / 0{index + 1} · {service.eyebrow}</span><h3>{service.title}</h3><p>{service.description}</p><Link href={service.href} aria-label={`Open ${service.title}`}>Open workspace <span aria-hidden="true">↗</span></Link></article>)}
        </div>
      </section>

      <section className="vd-how-section" id="how-it-works">
        <div className="vd-how-intro"><div className="vd-kicker">A FLOW THAT MAKES SENSE</div><h2>From first click<br />to clear next steps.</h2><p>No unnecessary complexity. Just a more considered way to move through your digital tasks.</p><Link className="vd-text-link" href="/sign-up">Start with Veltron <span aria-hidden="true">→</span></Link></div>
        <div className="vd-steps">{highlights.map((item) => <article className="vd-step" key={item.number}><div className="vd-step-number">{item.number}</div><div className="vd-step-icon" aria-hidden="true">{item.icon}</div><div><h3>{item.title}</h3><p>{item.body}</p></div><span className="vd-step-arrow" aria-hidden="true">↗</span></article>)}</div>
      </section>

      <section className="vd-trust-section" id="trust">
        <div className="vd-trust-card"><div className="vd-trust-orb" aria-hidden="true" /><div className="vd-kicker">BUILT WITH RESPONSIBILITY IN MIND</div><h2>Trust is in the details.</h2><p>Account controls, traceable activity, and careful payment handling matter as much as a polished interface. Veltron is being built to make those details easier to understand.</p><div className="vd-trust-points"><span><i>✓</i> Account-focused access</span><span><i>✓</i> Clear order status</span><span><i>✓</i> Payment checks before fulfilment</span></div><Link className="vd-button vd-button-primary" href="/sign-up">Build your workspace <span aria-hidden="true">↗</span></Link></div>
      </section>

      <section className="vd-final-cta"><div><div className="vd-kicker">YOUR NEXT STEP STARTS HERE</div><h2>Ready to move<br />things forward?</h2></div><div><p>Create your account and make your digital activity easier to manage.</p><Link className="vd-button vd-button-light" href="/sign-up">Get started with Veltron <span aria-hidden="true">↗</span></Link></div><div className="vd-cta-watermark" aria-hidden="true">v.</div></section>

      <footer className="vd-footer"><Link className="vd-brand" href="/"><span className="vd-brand-mark">v</span><span>veltron<span className="vd-brand-dot">.</span></span></Link><span>Digital, made more manageable.</span><div><Link href="/services">Services</Link><Link href="/faq">FAQ</Link><Link href="/sign-in">Sign in</Link><Link href="/sign-up">Create account</Link></div><small>© {new Date().getFullYear()} Veltron Digital</small></footer>
    </main>
  );
}
