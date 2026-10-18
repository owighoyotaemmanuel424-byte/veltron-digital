"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, PageHeading, Panel, StatusPill } from "@/components/veltron-ui";

type DocumentRecord = {
  id: string;
  kind: string;
  title: string;
  status: string;
  content: { body?: string; createdFor?: string; createdAt?: string; disclaimer?: string };
  createdAt: string;
};

export default function DocumentsPage() {
  const [kind, setKind] = useState("LETTER");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterKind, setFilterKind] = useState("ALL");

  async function load() {
    try {
      const response = await fetch("/api/documents", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load documents.");
      setDocuments(data.documents || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load documents."); }
  }

  // The loader intentionally updates state after its network request completes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);

  const filteredDocuments = documents.filter(doc => {
    const matchesKind = filterKind === "ALL" || doc.kind === filterKind;
    const query = search.trim().toLowerCase();
    return matchesKind && (!query || doc.title.toLowerCase().includes(query) || (doc.content.body || "").toLowerCase().includes(query));
  });

  async function create() {
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, title, body }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create document.");
      setTitle(""); setBody(""); setMessage("Draft saved. You can print it or save it as PDF from your browser.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create document."); }
    finally { setBusy(false); }
  }

  return <main className="workspace">
    <aside className="side-nav" aria-label="Workspace navigation">
      <Link className="brand" href="/">veltron<span>.</span></Link>
      <p className="side-label">WORKSPACE</p>
      <Link className="side-link" href="/dashboard">◫ &nbsp; Overview</Link>
      <Link className="side-link" href="/dashboard/products">▦ &nbsp; Products & tools</Link>
      <Link className="side-link" href="/services">◇ &nbsp; Service catalog</Link>
      <Link className="side-link" href="/dashboard/security">⌑ &nbsp; Account security</Link>
    </aside>
    <section className="workspace-main">
      <header className="workspace-header">
        <div><div className="eyebrow">DOCUMENT TOOLS</div><h1>Document drafts.</h1><p className="lead">Create and keep legitimate letters, business notes, and service summaries.</p></div>
      </header>
      <Panel className="card document-editor">
        <div className="eyebrow">NEW DOCUMENT</div>
        <label htmlFor="document-kind">Document type</label>
        <select id="document-kind" value={kind} onChange={e => setKind(e.target.value)}>
          <option value="LETTER">Letter</option>
          <option value="BUSINESS_NOTE">Business note</option>
          <option value="SERVICE_SUMMARY">Service summary</option>
        </select>
        <label htmlFor="document-title">Title</label>
        <input id="document-title" value={title} maxLength={120} onChange={e => setTitle(e.target.value)} placeholder="e.g. Project handover summary" />
        <label htmlFor="document-body">Content</label>
        <textarea id="document-body" value={body} maxLength={12000} rows={9} onChange={e => setBody(e.target.value)} placeholder="Write the document content…" />
        <p className="small-copy">These are user-created drafts, not bank statements, proof of funds, payment receipts, or third-party certifications.</p>
        <button className="button" disabled={busy || title.trim().length < 3 || body.trim().length < 10} onClick={() => void create()}>{busy ? "Saving…" : "Save document draft"}</button>
        {message && <p className="form-message" role="status">{message}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </Panel>
      <section className="dash-section">
        <div className="section-heading"><div><div className="eyebrow">SAVED IN YOUR ACCOUNT</div><h2>Recent drafts</h2></div><span className="dash-note">{filteredDocuments.length} of {documents.length} drafts</span></div>
        <div className="document-filters" aria-label="Filter saved drafts">
          <label htmlFor="document-search">Search drafts</label>
          <input id="document-search" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search titles and content…" />
          <label htmlFor="document-filter-kind">Document type</label>
          <select id="document-filter-kind" value={filterKind} onChange={e => setFilterKind(e.target.value)}>
            <option value="ALL">All types</option><option value="LETTER">Letters</option><option value="BUSINESS_NOTE">Business notes</option><option value="SERVICE_SUMMARY">Service summaries</option>
          </select>
          <button type="button" className="button secondary" onClick={() => { setSearch(""); setFilterKind("ALL"); }}>Clear filters</button>
          <button type="button" className="button secondary" onClick={() => void load()}>Refresh drafts</button>
        </div>
        {filteredDocuments.length ? <div className="document-list">{filteredDocuments.map(doc => <article className="card document-record" key={doc.id}>
          <div className="eyebrow">{doc.kind.replaceAll("_", " ")}</div><h3>{doc.title}</h3>
          <p className="small-copy"><StatusPill tone="neutral">Draft</StatusPill> · {new Date(doc.createdAt).toLocaleString()}</p>
          <pre className="document-preview">{doc.content.body || ""}</pre>
          <button className="button secondary" onClick={() => {
            const w = window.open("", "_blank");
            if (!w) { setError("Allow pop-ups to print this document."); return; }
            w.opener = null;
            const esc = (s: string) => s.replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c] || c));
            w.document.write("<!doctype html><html><head><title>"+esc(doc.title)+"</title><meta charset='utf-8'><style>body{font:16px/1.6 system-ui,sans-serif;max-width:760px;margin:48px auto;padding:0 24px;color:#111}pre{white-space:pre-wrap;font:inherit}.notice{margin-top:40px;border-top:1px solid #bbb;padding-top:12px;font-size:12px;color:#555}</style></head><body><h1>"+esc(doc.title)+"</h1><p>"+esc(doc.kind.replaceAll("_"," "))+" · Draft</p><pre>"+esc(doc.content.body || "")+"</pre><p class='notice'>User-created draft. Not proof of payment, identity, bank balance, or third-party certification.</p><script>window.onload=()=>window.print()</script></body></html>");
            w.document.close();
          }}>Print / Save as PDF</button>
        </article>)}</div> : <EmptyState title={documents.length ? "No drafts match these filters" : "No document drafts yet"} description={documents.length ? "Try a different search or clear the filters." : "Create a letter, business note, or service summary above."} />}
      </section>
    </section>
  </main>;
}
