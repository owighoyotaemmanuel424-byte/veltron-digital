import type { CatalogCategory } from "@/lib/catalog/types";
import type { SavedCatalogProduct } from "@/lib/catalog/my-products";

const date = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

export const demoMyProducts: SavedCatalogProduct[] = [
  { id: "demo-order-website-001", productId: "config-buy-domain", name: "Domain Registration", category: "website" as CatalogCategory, slug: "buy-domain", purchasedAt: date(2), configuration: { domain: "northstar", tld: ".com", years: 2, privacyAddon: true }, status: "Active" },
  { id: "demo-order-digital-002", productId: "config-wallet-funding", name: "Wallet Funding UI", category: "digital" as CatalogCategory, slug: "wallet-funding", purchasedAt: date(1), configuration: { sourceMethod: "bank", limits: "100 per transaction", walletId: "DEMO-WALLET-1042" }, status: "Pending" },
  { id: "demo-order-call-003", productId: "config-custom-caller", name: "Custom Caller Setup", category: "call" as CatalogCategory, slug: "custom-caller", purchasedAt: date(12), configuration: { callerIdName: "Northstar Support", number: "+1 555 0100", routing: "direct" }, status: "Active" },
  { id: "demo-order-mail-004", productId: "config-bank-mailer", name: "Bank Notification Mailer", category: "mail" as CatalogCategory, slug: "bank-mailer", purchasedAt: date(35), configuration: { bankName: "Northstar Demo", notificationTypes: ["statement", "security"], senderDomain: "mail.example.com" }, status: "Expired" },
  { id: "demo-order-generator-005", productId: "config-store-receipt", name: "Store Receipt Generator", category: "generator" as CatalogCategory, slug: "store-receipt", purchasedAt: date(5), configuration: { storeName: "Northstar Studio", orderId: "DEMO-ORDER-1005", itemsPlaceholder: "Sample items only", style: "minimal" }, status: "Active" },
  { id: "demo-order-website-006", productId: "config-ecommerce-site", name: "Ecommerce Site", category: "website" as CatalogCategory, slug: "ecommerce-site", purchasedAt: date(20), configuration: { storeName: "Northstar Shop", currency: "USD", productCountEstimate: 25, domain: "shop.example.com" }, status: "Pending" },
];
