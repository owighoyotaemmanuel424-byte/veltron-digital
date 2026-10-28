export type CatalogCategory = "GLOBAL_BUSINESS" | "CRYPTO_EXCHANGE" | "SAVINGS_VAULT" | "ANALYTICS_PRO";

export type CatalogTier = {
  name: string;
  priceMonthly: number;
  apy: number | null;
  feeRate: number;
  limits: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  category: CatalogCategory;
  tagline: string;
  description: string;
  feeRate: number;
  apyRate: number;
  popular?: boolean;
  features: string[];
  tiers: CatalogTier[];
};

export const categoryLabels: Record<CatalogCategory, string> = {
  GLOBAL_BUSINESS: "Global Business",
  CRYPTO_EXCHANGE: "Crypto Exchange",
  SAVINGS_VAULT: "Yield Vaults",
  ANALYTICS_PRO: "Pro Analytics",
};

export const catalogProducts: CatalogProduct[] = [
  {
    id: "biz-incorporation",
    name: "Global Incorporation Suite",
    category: "GLOBAL_BUSINESS",
    tagline: "Register and operate a company in 32 jurisdictions.",
    description:
      "Formation paperwork, registered agent, nominee directors and an operating account, handled end to end. Entity documents are generated from the same audited templates used by our partner law firms.",
    feeRate: 0.0025,
    apyRate: 0,
    popular: true,
    features: ["32 jurisdictions", "Registered agent included", "Annual filings calendar", "Multi-currency operating account"],
    tiers: [
      { name: "Starter", priceMonthly: 49, apy: null, feeRate: 0.0025, limits: "1 entity · 2 seats" },
      { name: "Growth", priceMonthly: 149, apy: null, feeRate: 0.0018, limits: "5 entities · 10 seats" },
      { name: "Scale", priceMonthly: 399, apy: null, feeRate: 0.0012, limits: "Unlimited entities" },
    ],
  },
  {
    id: "biz-payroll",
    name: "Cross-Border Payroll",
    category: "GLOBAL_BUSINESS",
    tagline: "Pay contractors in 44 currencies from one balance.",
    description:
      "Batch payouts with FX locked at quote time, automatic tax document collection, and a settlement ledger that reconciles to the cent on every run.",
    feeRate: 0.0035,
    apyRate: 0,
    features: ["44 payout currencies", "Locked FX quotes", "W-8BEN / W-9 collection", "Reconciliation export"],
    tiers: [
      { name: "Standard", priceMonthly: 29, apy: null, feeRate: 0.0035, limits: "Up to 25 payees" },
      { name: "Volume", priceMonthly: 99, apy: null, feeRate: 0.0022, limits: "Up to 250 payees" },
    ],
  },
  {
    id: "biz-invoicing",
    name: "Invoice & Treasury Desk",
    category: "GLOBAL_BUSINESS",
    tagline: "Issue, chase and settle invoices with treasury sync.",
    description:
      "Branded invoices, automated dunning sequences, and settlement straight into your treasury wallet with the ledger entry already posted.",
    feeRate: 0.0015,
    apyRate: 0,
    features: ["Branded PDF invoices", "Automated dunning", "Treasury settlement", "Aging dashboard"],
    tiers: [{ name: "Team", priceMonthly: 19, apy: null, feeRate: 0.0015, limits: "Unlimited invoices" }],
  },
  {
    id: "crypto-spot",
    name: "Spot Exchange Desk",
    category: "CRYPTO_EXCHANGE",
    tagline: "38 pairs with sub-second streaming order books.",
    description:
      "Market and limit execution against a streaming depth book. Balances move through the double-entry ledger, so every fill is auditable and locks release instantly on cancel.",
    feeRate: 0.001,
    apyRate: 0,
    popular: true,
    features: ["38 spot pairs", "Streaming depth book", "Maker rebates at volume", "Balance lock on order entry"],
    tiers: [
      { name: "Retail", priceMonthly: 0, apy: null, feeRate: 0.001, limits: "$250k / month" },
      { name: "Pro", priceMonthly: 29, apy: null, feeRate: 0.0006, limits: "$2.5m / month" },
      { name: "Institutional", priceMonthly: 199, apy: null, feeRate: 0.0003, limits: "Unlimited + OTC desk" },
    ],
  },
  {
    id: "crypto-custody",
    name: "Institutional Custody",
    category: "CRYPTO_EXCHANGE",
    tagline: "Multi-signature vaults with withdrawal policy engine.",
    description:
      "Cold-storage custody with configurable quorum, time-locked withdrawals and per-address allowlists enforced server-side before any signature is produced.",
    feeRate: 0.002,
    apyRate: 0,
    features: ["3-of-5 multisig", "Time-locked withdrawals", "Address allowlists", "Quarterly attestations"],
    tiers: [
      { name: "Vault", priceMonthly: 199, apy: null, feeRate: 0.002, limits: "Up to $5m AUM" },
      { name: "Institutional", priceMonthly: 799, apy: null, feeRate: 0.0012, limits: "Unlimited AUM" },
    ],
  },
  {
    id: "crypto-otc",
    name: "OTC Liquidity Desk",
    category: "CRYPTO_EXCHANGE",
    tagline: "Block executions with zero book impact.",
    description:
      "Request-for-quote execution for size, settled over the same ledger as spot. Indicative pricing streams to your dashboard during business hours.",
    feeRate: 0.0008,
    apyRate: 0,
    features: ["RFQ execution", "Streaming indications", "Settlement in T+0", "Named coverage"],
    tiers: [{ name: "Desk", priceMonthly: 499, apy: null, feeRate: 0.0008, limits: "From $250k / ticket" }],
  },
  {
    id: "vault-flex",
    name: "Flexible Yield Vault",
    category: "SAVINGS_VAULT",
    tagline: "Withdraw anytime, accrue daily.",
    description:
      "Deposits accrue interest every hour and compound back into the vault. No lock-up, so withdrawals settle on the next ledger posting without a penalty.",
    feeRate: 0.0005,
    apyRate: 4.85,
    popular: true,
    features: ["4.85% variable APY", "No lock-up", "Hourly accrual", "Instant withdrawal"],
    tiers: [
      { name: "Core", priceMonthly: 0, apy: 4.85, feeRate: 0.0005, limits: "$100k cap" },
      { name: "Plus", priceMonthly: 12, apy: 5.4, feeRate: 0.0004, limits: "$1m cap" },
    ],
  },
  {
    id: "vault-locked-12",
    name: "12-Month Locked Vault",
    category: "SAVINGS_VAULT",
    tagline: "Fixed 7.2% for a full year.",
    description:
      "A fixed-rate term deposit. Interest accrues hourly and is redeemable at maturity; early exit forfeits accrued yield but never principal.",
    feeRate: 0,
    apyRate: 7.2,
    features: ["Fixed 7.2% APY", "Hourly compounding", "Maturity reminder", "Principal protected"],
    tiers: [{ name: "Term", priceMonthly: 0, apy: 7.2, feeRate: 0, limits: "$25k minimum" }],
  },
  {
    id: "vault-goal",
    name: "Goal Savings Builder",
    category: "SAVINGS_VAULT",
    tagline: "Recurring deposits toward a named goal.",
    description:
      "Schedule daily, weekly or monthly transfers into a goal vault with a projection curve, streak tracking and automatic top-ups.",
    feeRate: 0.0005,
    apyRate: 3.9,
    features: ["Recurring schedules", "Projection curve", "Streak bonuses", "Auto top-up"],
    tiers: [{ name: "Builder", priceMonthly: 0, apy: 3.9, feeRate: 0.0005, limits: "5 goals" }],
  },
  {
    id: "analytics-ledger",
    name: "Ledger Analytics",
    category: "ANALYTICS_PRO",
    tagline: "Every posting, queryable and exportable.",
    description:
      "Double-entry ledgers with category tagging, audit trail and scheduled CSV/PDF tax summaries generated from immutable postings.",
    feeRate: 0,
    apyRate: 0,
    features: ["Immutable posting trail", "Category tagging", "Tax summary exports", "Audit log"],
    tiers: [
      { name: "Analyst", priceMonthly: 24, apy: null, feeRate: 0, limits: "12 months of history" },
      { name: "Firm", priceMonthly: 89, apy: null, feeRate: 0, limits: "Unlimited history" },
    ],
  },
  {
    id: "analytics-risk",
    name: "Risk & Exposure Monitor",
    category: "ANALYTICS_PRO",
    tagline: "Live exposure across fiat, crypto and vaults.",
    description:
      "Concentration limits, drawdown alerts and counterparty exposure computed on each ledger posting, with webhook delivery on breach.",
    feeRate: 0,
    apyRate: 0,
    features: ["Concentration limits", "Drawdown alerts", "Webhook delivery", "Board-ready reports"],
    tiers: [{ name: "Monitor", priceMonthly: 59, apy: null, feeRate: 0, limits: "10 portfolios" }],
  },
  {
    id: "analytics-api",
    name: "Data API Access",
    category: "ANALYTICS_PRO",
    tagline: "REST + WebSocket access to your own ledger.",
    description:
      "Signed API keys for programmatic access to balances, postings and market data, with Redis-backed rate limits and per-key usage analytics.",
    feeRate: 0,
    apyRate: 0,
    features: ["REST + WebSocket", "Scoped API keys", "Usage analytics", "HMAC signed webhooks"],
    tiers: [{ name: "Developer", priceMonthly: 39, apy: null, feeRate: 0, limits: "600 req / min" }],
  },
];

export const demoWalletBalance = 18420.75;

export const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

export const percent = (value: number) => `${value.toFixed(2)}%`;
