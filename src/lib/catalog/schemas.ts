import { z } from "zod";
import type { CatalogCategory } from "@/lib/catalog/types";

export type ConfigFieldKind = "text" | "select" | "number" | "checkbox" | "domain" | "phone" | "file" | "multiselect" | "color";
export type ConfigField = {
  name: string;
  label: string;
  kind: ConfigFieldKind;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
};

const optionList = (values: string[]) => values.map((value) => ({ label: value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()), value }));
const field = (name: string, label: string, kind: ConfigFieldKind = "text", extra: Partial<ConfigField> = {}): ConfigField => ({ name, label, kind, required: true, ...extra });
const domain = () => field("domain", "Domain name", "domain", { placeholder: "example.com", helpText: "Enter a domain you own or plan to register." });
const brandName = () => field("brandName", "Brand name", "text", { placeholder: "Your brand or business" });
const color = () => field("primaryColor", "Primary brand color", "color", { placeholder: "#2563eb" });
const template = () => field("templateId", "Template", "select", { options: optionList(["modern", "minimal", "corporate", "creative"]), placeholder: "Choose a template" });
const count = (name: string, label: string, min = 1, max = 1000) => field(name, label, "number", { min, max, step: 1, placeholder: String(min) });
const select = (name: string, label: string, values: string[]) => field(name, label, "select", { options: optionList(values) });
const multi = (name: string, label: string, values: string[]) => field(name, label, "multiselect", { options: optionList(values), helpText: "Select one or more options." });

const definitions: Record<string, ConfigField[]> = {
  "buy-domain": [field("domain", "Domain label", "text", { placeholder: "yourbrand" }), select("tld", "Domain extension", [".com", ".net", ".org", ".io", ".co", ".app"]), count("years", "Registration years", 1, 10), field("privacyAddon", "Add domain privacy", "checkbox", { required: false })],
  "buy-webmail": [domain(), count("mailboxes", "Number of mailboxes", 1, 500), count("storageGb", "Storage per mailbox (GB)", 1, 1000), count("aliases", "Email aliases", 0, 1000)],
  broker: [template(), brandName(), color(), field("logoPlaceholder", "Logo file", "file", { required: false, helpText: "Demo placeholder only; no file is uploaded." }), domain()],
  "online-banking": [template(), brandName(), color(), domain()],
  "tesla-giveaway": [count("prizeAmount", "Prize amount (USD)", 1, 10000000), field("entryEmail", "Entry contact email", "text", { placeholder: "contact@example.com" }), field("rulesUrl", "Official rules URL", "text", { placeholder: "https://example.com/rules" }), domain()],
  "tesla-investment": [select("planTier", "Plan tier", ["starter", "growth", "premium", "custom"]), count("minDeposit", "Illustrative minimum deposit (USD)", 0, 10000000), domain()],
  celebrity: [field("subjectName", "Subject name", "text", { placeholder: "Name to feature" }), field("socialLinks", "Social links", "text", { placeholder: "https://… (separate links with commas)", helpText: "Enter public URLs separated by commas." }), select("theme", "Visual theme", ["editorial", "bold", "minimal", "dark"]), domain()],
  "ecommerce-site": [field("storeName", "Store name"), select("currency", "Store currency", ["USD", "EUR", "GBP", "NGN", "CAD", "AUD"]), count("productCountEstimate", "Estimated product count", 1, 100000), domain()],
  "website-widgets": [select("widgetType", "Widget type", ["chat", "reviews", "pricing", "faq"]), field("embedTarget", "Embed target", "text", { placeholder: "e.g. homepage or /pricing" }), domain()],
  "support-pages": [brandName(), select("channel", "Support channel", ["email", "ticket", "chat"]), select("slaTier", "Response target", ["standard", "priority", "24-hour"]), domain()],
  "tracking-pages": [select("carrier", "Carrier", ["generic", "dhl", "fedex", "ups", "usps", "other"]), select("trackingMode", "Tracking mode", ["shipment", "activity"]), domain()],
  "transactions-trackers": [select("asset", "Asset type", ["crypto", "fiat"]), field("liveMode", "Enable live mode", "checkbox", { required: false, helpText: "Demo only; this never connects to a live data provider." }), domain()],
  wallets: [multi("chain", "Supported chains", ["ethereum", "bitcoin", "solana", "polygon", "base", "arbitrum"]), field("custodial", "Custodial wallet concept", "checkbox", { required: false }), field("branding", "Wallet branding", "text", { placeholder: "Brand name or visual direction" }), domain()],
  "wallet-funding": [select("sourceMethod", "Funding method", ["card", "bank", "crypto"]), field("limits", "Intended limits", "text", { placeholder: "e.g. 100 per transaction" }), field("walletId", "Wallet reference", "text", { placeholder: "Demo wallet ID" })],
  "sms-sender": [field("senderId", "Sender ID", "text", { placeholder: "Your sender name" }), multi("countryAllowlist", "Allowed countries", ["NG", "US", "GB", "CA", "GH", "KE", "ZA"]), count("monthlyQuota", "Monthly message quota", 1, 10000000)],
  "sms-verification": [multi("countries", "Countries", ["NG", "US", "GB", "CA", "GH", "KE", "ZA"]), field("serviceTarget", "Service or app", "text", { placeholder: "What are you verifying?" }), select("volumeTier", "Volume tier", ["low", "medium", "high", "enterprise"])],
  esim: [select("region", "Region", ["Africa", "Europe", "Asia", "North America", "South America", "Global"]), select("dataPlan", "Data plan", ["1GB", "3GB", "5GB", "10GB", "20GB", "unlimited"]), count("validityDays", "Validity (days)", 1, 365), count("quantity", "Quantity", 1, 20)],
  "buy-account": [select("platform", "Platform", ["general", "social", "developer", "business", "other"]), select("accountTier", "Account tier", ["standard", "premium", "business"]), count("quantity", "Quantity", 1, 100), select("region", "Region", ["global", "africa", "europe", "north-america", "asia"])],
  "account-verification": [select("platform", "Platform", ["general", "social", "developer", "business", "other"]), select("verificationType", "Verification type", ["id", "selfie", "address"]), count("quantity", "Quantity", 1, 100)],
  "custom-caller": [field("callerIdName", "Caller ID name", "text", { placeholder: "Displayed caller name" }), field("number", "Phone number", "phone", { placeholder: "+1 555 0100" }), select("routing", "Call routing", ["direct", "ivr", "voicemail"])],
  "voice-notes": [field("voiceSample", "Voice sample", "file", { required: false, helpText: "Placeholder only; audio is not uploaded or processed." }), field("schedule", "Schedule", "text", { placeholder: "e.g. weekdays at 9:00 AM" }), field("recipientList", "Recipient list", "text", { placeholder: "Names or addresses separated by commas" })],
  "crypto-mails": [count("listSize", "List size", 1, 10000000), select("templateStyle", "Template style", ["minimal", "newsletter", "transactional", "announcement"]), field("senderDomain", "Sender domain", "domain", { placeholder: "mail.example.com" })],
  "crypto-bills-mails": [field("invoiceBranding", "Invoice branding", "text", { placeholder: "Brand name or style" }), select("currency", "Currency", ["USD", "EUR", "GBP", "NGN", "BTC", "ETH"]), field("senderDomain", "Sender domain", "domain", { placeholder: "mail.example.com" })],
  "bank-mailer": [field("bankName", "Institution name", "text", { placeholder: "Institution or brand name" }), multi("notificationTypes", "Notification types", ["statement", "transaction", "security", "balance", "payment"]), field("senderDomain", "Sender domain", "domain", { placeholder: "mail.example.com" })],
  "crypto-receipts": [select("chain", "Blockchain", ["bitcoin", "ethereum", "solana", "polygon", "base", "other"]), field("txHashPreview", "Transaction hash (demo)", "text", { placeholder: "0x… or sample reference" }), field("recipientName", "Recipient display name"), count("amount", "Illustrative amount", 0, 100000000), select("style", "Receipt style", ["standard", "minimal", "branded"])],
  "bank-receipt": [field("bankName", "Institution name"), field("accountMask", "Masked account", "text", { placeholder: "•••• 1234" }), count("amount", "Illustrative amount", 0, 100000000), field("reference", "Reference", "text", { placeholder: "DEMO-REF-001" }), select("style", "Receipt style", ["standard", "minimal", "branded"])],
  "store-receipt": [field("storeName", "Store name"), field("orderId", "Order reference", "text", { placeholder: "DEMO-ORDER-001" }), field("itemsPlaceholder", "Items summary", "text", { placeholder: "Example items (demo only)" }), select("style", "Receipt style", ["standard", "minimal", "branded"])],
};

const fallbackFields: Record<CatalogCategory, ConfigField[]> = {
  website: [brandName(), field("projectGoal", "Project goal", "text", { placeholder: "What do you want to build?" }), domain()],
  digital: [field("intendedUse", "Intended use", "text", { placeholder: "How will you use this product?" }), count("quantity", "Quantity", 1, 100)],
  call: [field("teamSize", "Team size", "text", { placeholder: "e.g. 1–5 people" }), field("useCase", "Main use case", "text", { placeholder: "Describe your workflow" })],
  mail: [field("audience", "Audience or list size", "text", { placeholder: "e.g. 500 contacts" }), field("goal", "Campaign goal", "text", { placeholder: "What are you trying to achieve?" })],
  generator: [field("outputType", "What do you want to create?", "text", { placeholder: "Describe the intended output" }), select("style", "Style", ["standard", "minimal", "branded"])],
};

const valueSchema = (configField: ConfigField): z.ZodTypeAny => {
  let schema: z.ZodTypeAny;
  switch (configField.kind) {
    case "number": schema = z.coerce.number({ error: `${configField.label} must be a number.` }).min(configField.min ?? 0, `${configField.label} is too small.`).max(configField.max ?? 100000000, `${configField.label} is too large.`); break;
    case "checkbox": schema = z.boolean(); break;
    case "select": schema = z.string().min(1, `Choose ${configField.label.toLowerCase()}.`).refine((value) => (configField.options ?? []).some((option) => option.value === value), `Choose a valid ${configField.label.toLowerCase()}.`); break;
    case "multiselect": schema = z.array(z.string()).min(configField.required === false ? 0 : 1, `Choose at least one ${configField.label.toLowerCase()}.`).refine((values) => values.every((value) => (configField.options ?? []).some((option) => option.value === value)), "Choose valid options."); break;
    case "domain": schema = z.string().trim().min(1, "Enter a domain.").refine((value) => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z]{2,})+$/i.test(value), "Enter a valid domain such as example.com."); break;
    case "phone": schema = z.string().trim().min(7, "Enter a valid phone number.").max(25, "Phone number is too long.").regex(/^\+?[0-9 ()-]+$/, "Use digits and an optional leading +."); break;
    case "color": schema = z.string().regex(/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i, "Enter a valid hex color."); break;
    case "file": schema = z.string(); break;
    default: schema = z.string().trim();
  }
  if (configField.kind !== "checkbox" && configField.kind !== "multiselect" && configField.required !== false) {
    if (configField.kind === "number") return schema;
    if (configField.kind === "select" || configField.kind === "domain" || configField.kind === "phone" || configField.kind === "color") return schema;
    schema = (schema as z.ZodString).min(1, `${configField.label} is required.`);
  }
  return schema;
};

export const productConfigFields: Record<string, ConfigField[]> = definitions;
export const productConfigSchemas = Object.fromEntries(Object.entries(definitions).map(([slug, fields]) => [
  slug,
  z.object(Object.fromEntries(fields.map((configField) => [configField.name, valueSchema(configField)]))),
])) as Record<string, z.ZodObject<Record<string, z.ZodTypeAny>>>;

export function getConfigFields(slug: string, category: CatalogCategory): ConfigField[] {
  return definitions[slug] ?? fallbackFields[category];
}
export function getConfigSchema(slug: string, category: CatalogCategory) {
  return productConfigSchemas[slug] ?? z.object(Object.fromEntries(fallbackFields[category].map((configField) => [configField.name, valueSchema(configField)])));
}
export function getProductConfigSchema(slug: string) {
  return productConfigSchemas[slug];
}
export function parseConfigValue(configField: ConfigField, rawValue: string | boolean | string[]): unknown {
  if (configField.kind === "checkbox") return rawValue === true || rawValue === "true";
  if (configField.kind === "multiselect") return Array.isArray(rawValue) ? rawValue : typeof rawValue === "string" && rawValue ? rawValue.split(",").map((value) => value.trim()).filter(Boolean) : [];
  if (configField.kind === "number") return rawValue === "" ? undefined : Number(rawValue);
  return typeof rawValue === "string" ? rawValue : "";
}
