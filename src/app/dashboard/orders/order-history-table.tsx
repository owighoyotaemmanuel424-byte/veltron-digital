"use client";

import { useMemo, useState } from "react";

type OrderRow = {
  publicId: string;
  status: string;
  quantity: number;
  totalMinor: number;
  currency: string;
  createdAt: string;
  service: { name: string; category: string };
};

function money(minor: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(minor / 100);
  } catch {
    return currency + " " + (minor / 100).toFixed(2);
  }
}

export default function OrderHistoryTable({ orders }: { orders: OrderRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery = !q || [order.publicId, order.service.name, order.service.category]
        .some((value) => value.toLowerCase().includes(q));
      return matchesQuery && (status === "ALL" || order.status === status);
    });
  }, [orders, query, status]);

  return (
    <>
      <div className="order-filters" role="search" aria-label="Filter order history">
        <label>
          <span>Search orders</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Reference or service name" />
        </label>
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </label>
        <button className="button secondary" type="button" onClick={() => { setQuery(""); setStatus("ALL"); }}>Clear filters</button>
        <span className="order-filter-count" aria-live="polite">{filtered.length} of {orders.length} orders</span>
      </div>
      {filtered.length ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Service</th><th>Reference</th><th>Qty</th><th>Status</th><th>Total</th><th>Placed</th></tr></thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.publicId}>
                  <td><strong>{order.service.name}</strong><div className="dash-note">{order.service.category}</div></td>
                  <td><span className="order-reference">{order.publicId}</span></td>
                  <td>{order.quantity}</td>
                  <td><span className={`table-status status-${order.status.toLowerCase()}`}>{order.status.toLowerCase().replaceAll("_", " ")}</span></td>
                  <td>{money(order.totalMinor, order.currency)}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state"><h3>{orders.length ? "No matching orders" : "No orders yet"}</h3><p>{orders.length ? "Try a different reference, service name, or status." : "When you submit a service request, its reference, status, and total will appear here."}</p>{orders.length > 0 && <button className="button secondary" type="button" onClick={() => { setQuery(""); setStatus("ALL"); }}>Clear filters</button>}</div>
      )}
    </>
  );
}
