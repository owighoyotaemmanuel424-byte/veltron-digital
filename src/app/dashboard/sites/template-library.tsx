"use client";

const templates = [
  ["BUSINESS", "Business website", "Company, services, and customer-focused sections.", true],
  ["PORTFOLIO", "Personal portfolio", "Selected work, skills, and personal introduction.", true],
  ["LANDING_PAGE", "Landing page", "A focused offer with a clear call to action.", true],
  ["tpl_broker_trading_v2", "Broker Platform", "Trading dashboard layout; no brokerage functionality is connected.", false],
  ["tpl_online_banking_v4", "Online Banking Suite", "Financial information layout only; no bank impersonation or account handling.", false],
  ["tpl_tesla_giveaway_v1", "Giveaway Landing Page", "Promotional page with sponsor and eligibility disclosures.", false],
  ["tpl_tesla_investment_v1", "Investment Information", "Informational layout with risk disclosures; no guaranteed-return claims.", false],
  ["tpl_celebrity_portal_v1", "Fan Community Portal", "Community pages that do not impersonate a public figure.", false],
  ["tpl_ecommerce_suite_v2", "E-Commerce Platform", "Storefront layout; checkout and inventory are not connected.", false],
  ["tpl_widgets_embed_v1", "Website Widgets Suite", "Reusable widgets for supported embeds.", false],
  ["tpl_support_desk_v1", "Support Pages Module", "Help and contact pages; ticket delivery is not connected.", false],
  ["tpl_parcel_tracking_v3", "Tracking Pages Module", "Shipment page layout; live carrier tracking is not connected.", false],
  ["tpl_trx_tracker_v2", "Transactions Tracker", "Record overview only; does not verify or create payment evidence.", false],
  ["tpl_web3_wallet_v1", "Crypto & Web3 Wallets", "Informational layout; wallet connections and transaction signing are not integrated.", false],
] as const;

export default function WebsiteTemplateLibrary({ selected, onSelect }: { selected: string; onSelect: (template: string) => void }) {
  return <section className="dash-section">
    <div className="section-heading"><div><div className="eyebrow">TEMPLATE LIBRARY</div><h2>Choose a website starting point</h2></div><span className="dash-note">3 editable now · 11 reference modules</span></div>
    <div className="website-template-grid">
      {templates.map(([id, title, description, available]) => <article key={id} className={"card website-template-card" + (!available ? " is-locked" : selected === id ? " is-selected" : "")}>
        <span className="template-status">{available ? "AVAILABLE NOW" : "PLANNED · NOT AVAILABLE"}</span><h3>{title}</h3><p>{description}</p>
        {available ? <button type="button" className="button secondary" aria-pressed={selected === id} onClick={() => onSelect(id)}>{selected === id ? "Selected" : "Use template"}</button> : <span className="template-action">Provider/setup required</span>}
      </article>)}
    </div>
  </section>;
}
