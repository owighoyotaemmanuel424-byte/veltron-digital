import { describe, expect, it } from "vitest";
import { getConfigFields, getConfigSchema, productConfigSchemas } from "@/lib/catalog/schemas";

const expectedSlugs = [
  "buy-domain", "buy-webmail", "broker", "online-banking", "tesla-giveaway",
  "tesla-investment", "celebrity", "ecommerce-site", "website-widgets", "support-pages",
  "tracking-pages", "transactions-trackers", "wallets", "wallet-funding", "sms-sender",
  "sms-verification", "esim", "buy-account", "account-verification", "custom-caller",
  "voice-notes", "crypto-mails", "crypto-bills-mails", "bank-mailer", "crypto-receipts",
  "bank-receipt", "store-receipt",
];

describe("product configuration schemas", () => {
  it("provides a dedicated schema and field list for every configured product slug", () => {
    expect(Object.keys(productConfigSchemas).sort()).toEqual([...expectedSlugs].sort());
    for (const slug of expectedSlugs) {
      expect(getConfigFields(slug, "website").length).toBeGreaterThan(0);
    }
  });

  it("validates a domain purchase and rejects missing or malformed values", () => {
    const schema = getConfigSchema("buy-domain", "website");
    expect(schema.safeParse({ domain: "mybrand", tld: ".com", years: 2, privacyAddon: false }).success).toBe(true);
    expect(schema.safeParse({ domain: "", tld: ".com", years: 2, privacyAddon: false }).success).toBe(false);
    expect(schema.safeParse({ domain: "mybrand", tld: ".invalid", years: 2, privacyAddon: false }).success).toBe(false);
  });

  it("validates phone, checkbox, and multi-select field types", () => {
    expect(getConfigSchema("custom-caller", "call").safeParse({ callerIdName: "Support", number: "+1 555 0100", routing: "ivr" }).success).toBe(true);
    expect(getConfigSchema("custom-caller", "call").safeParse({ callerIdName: "Support", number: "not-a-number", routing: "ivr" }).success).toBe(false);
    expect(getConfigSchema("wallets", "website").safeParse({ chain: ["ethereum", "base"], custodial: false, branding: "Demo", domain: "example.com" }).success).toBe(true);
    expect(getConfigSchema("wallets", "website").safeParse({ chain: [], custodial: false, branding: "Demo", domain: "example.com" }).success).toBe(false);
  });

  it("keeps file inputs as optional demo placeholders where configured", () => {
    expect(getConfigSchema("broker", "website").safeParse({ templateId: "modern", brandName: "Demo", primaryColor: "#2563eb", logoPlaceholder: "", domain: "example.com" }).success).toBe(true);
  });
});
