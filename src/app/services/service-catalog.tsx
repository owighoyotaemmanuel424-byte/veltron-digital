"use client";

import { useMemo, useState } from "react";
import ServiceOrderAction from "./service-order-action";

type Service = { id: string; name: string; description: string; category: string; priceMinor: number; currency: string };

function money(minor: number, currency: string) {
  try { return new Intl.NumberFormat("en", { style: "currency", currency }).format(minor / 100); }
  catch { return currency + " " + (minor / 100).toFixed(2); }
}

export default function ServiceCatalog({ services }: { services: Service[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const categories = useMemo(() => [...new Set(services.map((service) => service.category.trim() || "Other services"))].sort((a, b) => a.localeCompare(b)), [services]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((service) => {
      const serviceCategory = service.category.trim() || "Other services";
      return (category === "ALL" || serviceCategory === category) &&
        (!q || [service.name, service.description, serviceCategory].some((value) => value.toLowerCase().includes(q)));
    });
  }, [services, query, category]);

  return <>
    <div className="catalog-filters" role="search" aria-label="Filter service catalog">
      <label><span>Search services</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or description" /></label>
      <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="ALL">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <button className="button secondary" type="button" onClick={() => { setQuery(""); setCategory("ALL"); }}>Clear filters</button>
      <span className="catalog-result-count" aria-live="polite">{filtered.length} of {services.length} services</span>
    </div>
    {filtered.length ? <div className="cards">{filtered.map((service) => <article className="card" key={service.id}>
      <div className="eyebrow">{service.category || "Other services"}</div><h2>{service.name}</h2><p>{service.description}</p><strong>{money(service.priceMinor, service.currency)}</strong>
      <ServiceOrderAction serviceId={service.id} serviceName={service.name} />
    </article>)}</div> : <div className="empty-state"><div className="empty-mark">◇</div><h3>No matching services</h3><p>Try another search or choose a different category.</p><button className="button secondary" type="button" onClick={() => { setQuery(""); setCategory("ALL"); }}>Clear filters</button></div>}
  </>;
}
