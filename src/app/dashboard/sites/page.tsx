"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import WebsiteTemplateLibrary from "./template-library";

type SiteContent = {
  headline: string;
  tagline: string;
  description: string;
  buttonText: string;
  sectionOneTitle: string;
  sectionOneBody: string;
  sectionTwoTitle: string;
  sectionTwoBody: string;
};
type SiteRecord = {
  id: string;
  name: string;
  template: string;
  domain: string | null;
  status: string;
  content: SiteContent | null;
  createdAt: string;
};
const templateNames: Record<string, string> = {
  PORTFOLIO: "Personal portfolio",
  BUSINESS: "Business website",
  LANDING_PAGE: "Landing page",
};
const emptyContent: SiteContent = {
  headline: "Thoughtful service. Real results.",
  tagline: "WELCOME TO OUR BUSINESS",
  description: "A modern online home for your company, services, and customers.",
  buttonText: "Explore services",
  sectionOneTitle: "What we do",
  sectionOneBody: "Introduce your core services and the people or businesses you support.",
  sectionTwoTitle: "Why work with us",
  sectionTwoBody: "Explain your approach, your values, and what customers can expect.",
};
const fieldLabels: Record<keyof SiteContent, string> = {
  headline: "Main headline",
  tagline: "Eyebrow / short label",
  description: "Introductory description",
  buttonText: "Call-to-action text",
  sectionOneTitle: "First section heading",
  sectionOneBody: "First section text",
  sectionTwoTitle: "Second section heading",
  sectionTwoBody: "Second section text",
};
export default function WebsitesPage() {
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("BUSINESS");
  const [sites, setSites] = useState<SiteRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [content, setContent] = useState<SiteContent>(emptyContent);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load(preferredId?: string) {
    const response = await fetch("/api/sites", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load websites.");
    const rows: SiteRecord[] = data.sites || [];
    setSites(rows);
    const target = rows.find(site => site.id === (preferredId || selectedId)) || rows[0];
    if (target) {
      setSelectedId(target.id);
      setName(target.name);
      setTemplate(target.template);
      setContent({ ...emptyContent, ...(target.content || {}) });
    } else {
      setSelectedId("");
    }
  }
  // The loader intentionally updates state after its network request completes.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load().catch(e => setError(e instanceof Error ? e.message : "Could not load websites.")); }, []);

  function chooseSite(site: SiteRecord) {
    setSelectedId(site.id);
    setName(site.name);
    setTemplate(site.template);
    setContent({ ...emptyContent, ...(site.content || {}) });
    setMessage("");
    setError("");
  }
  function changeTemplate(value: string) {
    setTemplate(value);
    setContent(value === "PORTFOLIO" ? {
      ...emptyContent, tagline: "PERSONAL PORTFOLIO", headline: "Ideas made with purpose.",
      description: "A home for selected work, skills, and creative direction.", buttonText: "Explore my work",
      sectionOneTitle: "Selected work", sectionOneBody: "Show the projects that best represent your craft and experience.",
      sectionTwoTitle: "About me", sectionTwoBody: "Share your story, your approach, and what makes your work distinct.",
    } : value === "LANDING_PAGE" ? {
      ...emptyContent, tagline: "INTRODUCING SOMETHING NEW", headline: "Make your next move count.",
      description: "A focused message, a clear offer, and one useful next step for your audience.", buttonText: "Get started",
      sectionOneTitle: "Why this matters", sectionOneBody: "Explain the value your offer brings and who it is designed to help.",
      sectionTwoTitle: "Take the next step", sectionTwoBody: "Tell visitors how to learn more, get in touch, or move forward.",
    } : emptyContent);
  }
  async function save(createNew: boolean) {
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/sites", {
        method: createNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createNew ? { name, template } : { id: selectedId, name, template, content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save website changes.");
      const savedId = data.site?.id || selectedId;
      await load(savedId);
      setMessage(createNew ? "Website draft created. You can now edit its content and save changes." : "Your website content has been saved to your account.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save website changes.");
    } finally { setBusy(false); }
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
      <header className="workspace-header"><div><div className="eyebrow">WEBSITE CREATOR</div><h1>Build your website draft.</h1><p className="lead">Edit the copy in your selected template and save it privately to your account. Saving does not publish a live website.</p></div></header>
      <section className="dash-section">
        <div className="section-heading"><div><div className="eyebrow">YOUR PROJECTS</div><h2>Saved websites</h2></div><span className="dash-note">{sites.length} shown · latest 50</span></div>
        {sites.length ? <div className="document-list">{sites.map(site => <button type="button" key={site.id} className={"card document-record site-select-card" + (site.id === selectedId ? " is-selected" : "")} onClick={() => chooseSite(site)}><div className="eyebrow">{templateNames[site.template] || site.template}</div><h3>{site.name}</h3><p className="small-copy">Status: {site.status} · {site.domain || "No domain attached"}</p></button>)}</div> : <div className="empty-state"><h3>No website projects yet</h3><p>Create a project below to begin editing.</p></div>}
      </section>
      <WebsiteTemplateLibrary selected={template} onSelect={changeTemplate} />
      <div className="website-builder-grid">
        <article className="card document-editor">
          <div className="eyebrow">{selectedId ? "EDIT WEBSITE PROJECT" : "NEW WEBSITE PROJECT"}</div>
          <label htmlFor="site-name">Website or project name</label>
          <input id="site-name" value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder="e.g. Brightline Consulting" />
          <label htmlFor="site-template">Template</label>
          <select id="site-template" value={template} onChange={e => changeTemplate(e.target.value)}><option value="BUSINESS">Business website</option><option value="PORTFOLIO">Personal portfolio</option><option value="LANDING_PAGE">Landing page</option></select>
          <div className="eyebrow content-editor-label">EDIT PAGE CONTENT</div>
          {(Object.keys(fieldLabels) as (keyof SiteContent)[]).map(key => <div className="site-content-field" key={key}><label htmlFor={"site-"+key}>{fieldLabels[key]}</label>{key.endsWith("Body") || key === "description" ? <textarea id={"site-"+key} value={content[key]} maxLength={key === "description" ? 1000 : 400} rows={3} onChange={e => setContent(current => ({ ...current, [key]: e.target.value }))} /> : <input id={"site-"+key} value={content[key]} maxLength={key === "headline" ? 120 : key === "tagline" ? 160 : 80} onChange={e => setContent(current => ({ ...current, [key]: e.target.value }))} />}</div>)}
          <p className="small-copy">Content is stored with this draft. Publishing, hosting, custom domains, DNS, and SSL are not connected.</p>
          <div className="site-editor-actions"><button className="button" disabled={busy || name.trim().length < 2} onClick={() => void save(!selectedId)}>{busy ? "Saving…" : selectedId ? "Save website changes" : "Create website draft"}</button>{selectedId && <button className="button button-secondary" disabled={busy} onClick={() => { setSelectedId(""); setName(""); setTemplate("BUSINESS"); setContent(emptyContent); setMessage(""); setError(""); }}>New project</button>}</div>
          {message && <p className="form-message" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}
        </article>
        <article className={"card website-live-preview website-preview-" + template.toLowerCase()} aria-label="Website template preview">
          <div className="eyebrow">LIVE EDITOR PREVIEW · NOT PUBLISHED</div>
          <div className="website-preview-page">
            <div className="website-preview-nav"><strong>{name.trim() || "Your brand"}</strong><span>About · Services · Contact</span></div>
            <div className="website-preview-hero"><p className="website-preview-kicker">{content.tagline}</p><h2>{content.headline}</h2><p>{content.description}</p><span className="website-preview-cta">{content.buttonText} →</span></div>
            <div className="website-preview-feature-row"><div><b>01</b><strong>{content.sectionOneTitle}</strong><p>{content.sectionOneBody}</p></div><div><b>02</b><strong>{content.sectionTwoTitle}</strong><p>{content.sectionTwoBody}</p></div></div>
          </div>
          <p className="small-copy">Preview updates as you type. Save changes to persist them. This is not a public website.</p>
        </article>
      </div>
    </section>
  </main>;
}
