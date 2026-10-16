"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Service = { id: string; slug: string; name: string; description: string; category: string; priceMinor: number; currency: string; status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED"; _count?: { orders: number } };
type PlatformUser = { id: string; email: string; name: string | null; role: "CUSTOMER" | "SUPPORT" | "ADMIN" | "SUPER_ADMIN"; status: "ACTIVE" | "SUSPENDED" | "PENDING"; emailVerifiedAt: string | null; createdAt: string; _count: { orders: number } };
type Tab = "services" | "users";

export default function AdminManagement({ currentUserId, isSuperAdmin }: { currentUserId: string; isSuperAdmin: boolean }) {
  const [tab, setTab] = useState<Tab>("services");
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("NGN");

  const loadServices = useCallback(async () => {
    const response = await fetch("/api/admin/services", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load services.");
    setServices(data.services);
  }, []);
  const loadUsers = useCallback(async (search = query) => {
    const response = await fetch("/api/admin/users" + (search.trim() ? "?q=" + encodeURIComponent(search.trim()) : ""), { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load users.");
    setUsers(data.users);
  }, [query]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/services", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load services.");
        if (active) setServices(data.services);
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Could not load services."); }
    }
    void load();
    return () => { active = false; };
  }, []);

  function resetForm() {
    setEditingId(""); setSlug(""); setName(""); setDescription(""); setCategory(""); setPrice(""); setCurrency("NGN");
  }
  function editService(service: Service) {
    setEditingId(service.id); setSlug(service.slug); setName(service.name); setDescription(service.description);
    setCategory(service.category); setPrice((service.priceMinor / 100).toFixed(2)); setCurrency(service.currency);
    setTab("services");
    document.getElementById("admin-service-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function submitService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const amount = Number(price);
    if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) > 100_000_000) {
      setError("Enter a positive price. Prices are saved in minor units (for NGN, kobo)."); setBusy(false); return;
    }
    const body = { slug: slug.trim().toLowerCase(), name: name.trim(), description: description.trim(), category: category.trim(), priceMinor: Math.round(amount * 100), currency: currency.trim().toUpperCase(), ...(editingId ? { id: editingId } : { status: "DRAFT" }) };
    try {
      const response = await fetch("/api/admin/services", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save service.");
      await loadServices(); resetForm(); setMessage(editingId ? "Service updated." : "Service created as a draft. Activate it when it is ready for customers.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save service."); }
    finally { setBusy(false); }
  }
  async function updateServiceStatus(service: Service, status: Service["status"]) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/services", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: service.id, status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update service.");
      await loadServices(); setMessage("Service status updated.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update service."); }
    finally { setBusy(false); }
  }
  async function updateUser(user: PlatformUser, changes: { status?: PlatformUser["status"]; role?: "CUSTOMER" | "SUPPORT" | "ADMIN" }) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id, ...changes }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update user.");
      await loadUsers(); setMessage("User updated and the action was recorded in the audit log.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update user."); }
    finally { setBusy(false); }
  }
  async function searchUsers(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); try { await loadUsers(query); } catch (e) { setError(e instanceof Error ? e.message : "Could not search users."); } }
  async function switchTab(next: Tab) {
    setTab(next); setError(""); setMessage("");
    if (next === "users" && users.length === 0) { try { await loadUsers(""); } catch (e) { setError(e instanceof Error ? e.message : "Could not load users."); } }
  }

  return <section className="dash-section admin-management">
    <div className="section-heading"><div><div className="eyebrow">PLATFORM OPERATIONS</div><h2>Manage services and users</h2></div><div className="admin-tabs" role="tablist" aria-label="Administration sections"><button type="button" role="tab" aria-selected={tab === "services"} className={"admin-tab " + (tab === "services" ? "selected" : "")} onClick={() => void switchTab("services")}>Services</button><button type="button" role="tab" aria-selected={tab === "users"} className={"admin-tab " + (tab === "users" ? "selected" : "")} onClick={() => void switchTab("users")}>Users</button></div></div>
    {error ? <p role="alert" className="form-error">{error}</p> : null}
    {message ? <p role="status" className="form-message">{message}</p> : null}
    {tab === "services" ? <>
      <form id="admin-service-form" className="admin-service-form" onSubmit={submitService}>
        <div><div className="eyebrow">{editingId ? "EDIT SERVICE" : "NEW SERVICE"}</div><h3>{editingId ? "Update catalog item" : "Create a service draft"}</h3><p className="small-copy">New services start as drafts. Only activate services that can actually be delivered.</p></div>
        <div className="admin-form-grid">
          <label>Service name<input required minLength={2} maxLength={120} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Website setup" /></label>
          <label>Slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="website-setup" /></label>
          <label>Category<input required minLength={2} maxLength={80} value={category} onChange={e => setCategory(e.target.value)} placeholder="Digital services" /></label>
          <label>Price<input required type="number" min="0.01" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="2500.00" /></label>
          <label>Currency<input required minLength={3} maxLength={3} value={currency} onChange={e => setCurrency(e.target.value.toUpperCase())} /></label>
          <label className="admin-description">Description<textarea required minLength={5} maxLength={2000} rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Explain exactly what the customer receives." /></label>
        </div>
        <div className="actions"><button className="button" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Create draft"}</button>{editingId ? <button type="button" className="button secondary" onClick={resetForm}>Cancel edit</button> : null}</div>
      </form>
      <div className="table-wrap"><table><thead><tr><th>Service</th><th>Category</th><th>Price</th><th>Orders</th><th>Status</th><th>Actions</th></tr></thead><tbody>{services.map(service => <tr key={service.id}><td><strong>{service.name}</strong><div className="small-copy">{service.slug}</div></td><td>{service.category}</td><td>{new Intl.NumberFormat("en", { style: "currency", currency: service.currency }).format(service.priceMinor / 100)}</td><td>{service._count?.orders ?? 0}</td><td><span className="table-status">{service.status.toLowerCase()}</span></td><td><div className="admin-row-actions"><button type="button" className="small-button" onClick={() => editService(service)}>Edit</button><select aria-label={"Change status for " + service.name} disabled={busy} value={service.status} onChange={e => void updateServiceStatus(service, e.target.value as Service["status"])}><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="PAUSED">Paused</option><option value="ARCHIVED">Archived</option></select></div></td></tr>)}</tbody></table>{services.length === 0 ? <div className="empty-state compact"><h3>No services found</h3><p>Create a draft above. It will not appear in the customer catalog until activated.</p></div> : null}</div>
    </> : <>
      <form className="admin-search" onSubmit={searchUsers}><label htmlFor="user-search">Search users by name or email</label><div><input id="user-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search accounts…" /><button className="button" disabled={busy}>Search</button></div></form>
      <div className="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Verified</th><th>Orders</th><th>Actions</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td><strong>{user.name || "Unnamed user"}</strong><div className="small-copy">{user.email}</div></td><td>{user.role.toLowerCase().replace("_", " ")}</td><td><span className="table-status">{user.status.toLowerCase()}</span></td><td>{user.emailVerifiedAt ? "Yes" : "No"}</td><td>{user._count.orders}</td><td>{user.id === currentUserId || user.role === "SUPER_ADMIN" ? <span className="small-copy">Protected account</span> : <div className="admin-row-actions"><select aria-label={"Change status for " + user.email} disabled={busy} value={user.status} onChange={e => void updateUser(user, { status: e.target.value as PlatformUser["status"] })}><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="PENDING">Pending</option></select>{isSuperAdmin ? <select aria-label={"Change role for " + user.email} disabled={busy} value={user.role === "SUPER_ADMIN" ? "ADMIN" : user.role} onChange={e => void updateUser(user, { role: e.target.value as "CUSTOMER" | "SUPPORT" | "ADMIN" })}><option value="CUSTOMER">Customer</option><option value="SUPPORT">Support</option><option value="ADMIN">Admin</option></select> : null}</div>}</td></tr>)}</tbody></table>{users.length === 0 ? <div className="empty-state compact"><h3>No matching users</h3><p>Try another name or email address.</p></div> : null}</div>
      <p className="small-copy">Only super-admins can change roles. Super-admin accounts and your current account are protected from edits here.</p>
    </>}
  </section>;
}
