"use client";

import { useState } from "react";
import Link from "next/link";

export default function ServiceOrderAction({ serviceId, serviceName }: { serviceId: string; serviceName: string }) {
  const [quantity, setQuantity] = useState("1");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);

  async function createOrder() {
    setBusy(true); setMessage(""); setError(""); setNeedsSignIn(false);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, quantity: Number(quantity), idempotencyKey: crypto.randomUUID() }),
      });
      const data = await response.json();
      if (response.status === 401) { setNeedsSignIn(true); throw new Error("Sign in to save an order request."); }
      if (!response.ok) throw new Error(data.error || "Could not create order request.");
      setMessage("Request saved as pending. No payment was taken, and fulfillment is not automated yet.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create order request.");
    } finally { setBusy(false); }
  }

  return <div className="service-order-action">
    <label htmlFor={"quantity-" + serviceId}>Quantity</label>
    <input id={"quantity-" + serviceId} type="number" min="1" max="1000" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
    <button type="button" className="button full" disabled={busy || !Number.isInteger(Number(quantity)) || Number(quantity) < 1 || Number(quantity) > 1000} onClick={() => void createOrder()}>{busy ? "Saving request…" : "Create order request"}</button>
    {message ? <p className="form-message" role="status">{message} <Link href="/dashboard" className="text-link">View dashboard</Link></p> : null}
    {error ? <p className="form-error" role="alert">{error} {needsSignIn ? <Link href="/sign-in" className="text-link">Sign in</Link> : null}</p> : null}
    <p className="small-copy">Request only — no payment or automatic delivery is enabled.</p>
  </div>;
}
