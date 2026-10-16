"use client";

import { useCallback, useEffect, useState } from "react";

type AdminOrder = {
  id: string; publicId: string; status: "PENDING" | "PAID" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED";
  quantity: number; unitPriceMinor: number; totalMinor: number; currency: string; createdAt: string;
  user: { id: string; email: string; name: string | null };
  service: { name: string; category: string };
  payments: { status: string; amountMinor: number; currency: string }[];
};

function money(amount: number, currency: string) {
  try { return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount / 100); }
  catch { return currency + " " + (amount / 100).toFixed(2); }
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/orders", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load orders.");
    setOrders(data.orders);
  }, []);
  useEffect(() => {
    let active = true;
    fetch("/api/admin/orders", { cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load orders.");
      if (active) setOrders(data.orders);
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : "Could not load orders."); });
    return () => { active = false; };
  }, []);
  async function cancel(order: AdminOrder) {
    if (!window.confirm("Cancel this pending order request? No payment will be initiated.")) return;
    setBusyId(order.id); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: order.id, status: "CANCELLED" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not cancel order.");
      await load(); setMessage("Pending order cancelled and recorded in the audit log.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not cancel order."); }
    finally { setBusyId(""); }
  }
  return <section className="dash-section admin-orders"><div className="section-heading"><div><div className="eyebrow">ORDER OPERATIONS</div><h2>Customer order requests</h2></div><button type="button" className="small-button" onClick={() => { setError(""); void load().catch(e => setError(e instanceof Error ? e.message : "Refresh failed.")); }}>Refresh</button></div>
    <p className="small-copy">Requests are recorded as pending. Payment, refunds, and provider fulfilment remain disabled until reconciliation and fulfilment controls are implemented.</p>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {message ? <p className="form-message" role="status">{message}</p> : null}
    <div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Service</th><th>Qty</th><th>Total</th><th>Status</th><th>Payments</th><th>Action</th></tr></thead><tbody>{orders.map(order => <tr key={order.id}><td><strong>{order.publicId.slice(0, 12)}</strong><div className="small-copy">{new Date(order.createdAt).toLocaleString("en")}</div></td><td>{order.user.name || "Customer"}<div className="small-copy">{order.user.email}</div></td><td>{order.service.name}<div className="small-copy">{order.service.category}</div></td><td>{order.quantity}</td><td>{money(order.totalMinor, order.currency)}</td><td><span className="table-status">{order.status.toLowerCase()}</span></td><td>{order.payments.length ? order.payments.map((p, i) => <div key={i} className="small-copy">{p.status.toLowerCase()}</div>) : "None"}</td><td>{order.status === "PENDING" ? <button type="button" className="small-button" disabled={busyId === order.id} onClick={() => void cancel(order)}>{busyId === order.id ? "Cancelling…" : "Cancel pending"}</button> : <span className="small-copy">No action</span>}</td></tr>)}</tbody></table>{orders.length === 0 ? <div className="empty-state compact"><h3>No order requests yet</h3><p>Customer order requests will appear here.</p></div> : null}</div>
  </section>;
}
