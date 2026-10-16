"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SiteRecord = {
  id: string;
  name: string;
  template: string;
  domain: string | null;
  status: string;
  createdAt: string;
};

const templateNames: Record<string, string> = {
  PORTFOLIO: "Personal portfolio",
  BUSINESS: "Business website",
  LANDING_PAGE: "Landing page",
};

export default function WebsitesPage() {
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("BUSINESS");
  const [sites, setSites] = useState<SiteRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/sites", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load websites.");
      setSites(data.sites || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load websites.");
    }
  }

  useEffect(() => { void load(); }, []);

  async function create() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, template }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create website draft.");
      setName("");
      setMessage("Website draft saved. Hosting and domain publishing are not configured yet.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create website draft.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="workspace">
    <aside className="side-nav" aria-label="Workspace navigation">
      <Link className="brand" href="/">veltron<span>.</span></Link>
      <p className="side-label">WORKSPACE</p>
      <Link className="side-link" href="/dashboard">◫ &nbsp; Overview</Link>
      <Link className="side-link" href="/dashboard/products">▦ &nbsp; Products & tools</Link>
      <Link className="side-link" href="/dashboard/documents">▤ &nbsp; Document drafts</Link>
      <Link className="side-link" href="/services">◇ &nbsp; Service catalog</Link>
      <Link className="side-link" href="/dashboard/security">⌑ &nbsp; Account security</Link>
    </aside>
    <section className="workspace-main">
      <header className="workspace-header">
        <div><div className="eyebrow">WEBSITE CREATOR</div><h1>Website drafts.</h1><p className="lead">Start a site record and choose the type of site you want to build. This saves your project; it does not publish a live website.</p></div>
      </header>
      <article className="card document-editor">
        <div className="eyebrow">NEW WEBSITE PROJECT</div>
        <label htmlFor="site-name">Website or project name</label>
        <input id="site-name" value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder="e.g. Brightline Consulting" />
        <label htmlFor="site-template">Starting template</label>
        <select id="site-template" value={template} onChange={e => setTemplate(e.target.value)}>
          <option value="BUSINESS">Business website</option>
          <option value="PORTFOLIO">Personal portfolio</option>
          <option value="LANDING_PAGE">Landing page</option>
        </select>
        <p className="small-copy">Current milestone saves a private draft in your account. Template rendering, hosting deployment, custom domains, DNS, and SSL provisioning are not connected yet.</p>
        <button className="button" disabled={busy || name.trim().length < 2} onClick={() => void create()}>{busy ? "Saving…" : "Create website draft"}</button>
        {message && <p className="form-message" role="status">{message}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </article>
      <section className="dash-section">
        <div className="section-heading"><div><div className="eyebrow">SAVED IN YOUR ACCOUNT</div><h2>Your website projects</h2></div><span className="dash-note">{sites.length} shown · latest 50</span></div>
        {sites.length ? <div className="document-list">{sites.map(site => <article className="card document-record" key={site.id}>
          <div className="eyebrow">{templateNames[site.template] || site.template}</div>
          <h3>{site.name}</h3>
          <p className="small-copy">Status: {site.status} · Created {new Date(site.createdAt).toLocaleString()}</p>
          <p className="small-copy">{site.domain ? "Domain: " + site.domain : "No domain attached"} · Publishing not configured</p>
        </article>)}</div> : <div className="empty-state"><h3>No website projects yet</h3><p>Create your first website draft above.</p></div>}
      </section>
    </section>
  </main>;
}
