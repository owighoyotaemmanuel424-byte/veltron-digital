import type { CatalogCategory } from "@/lib/catalog/types";
import type { SavedCatalogProduct } from "@/lib/catalog/my-products";

const date = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

export const demoMyProducts: SavedCatalogProduct[] = [
  { id: "demo-order-website-001", productId: "website-starter", name: "Starter Website", category: "website" as CatalogCategory, slug: "starter-website", purchasedAt: date(2), configuration: { brandName: "Northstar Studio", projectGoal: "Portfolio and contact page", domain: "northstar.example" }, status: "Active" },
  { id: "demo-order-mail-002", productId: "mail-business-001", name: "Business Email Setup", category: "mail" as CatalogCategory, slug: "business-email-setup", purchasedAt: date(1), configuration: { domain: "northstar.example", mailboxes: 5, storageGb: 10 }, status: "Pending" },
  { id: "demo-order-digital-003", productId: "digital-productivity-001", name: "Productivity Suite", category: "digital" as CatalogCategory, slug: "productivity-suite", purchasedAt: date(12), configuration: { workspaceName: "Northstar team", seats: 4, plan: "monthly" }, status: "Active" },
  { id: "demo-order-call-004", productId: "call-workflow-001", name: "Call Workflow Planner", category: "call" as CatalogCategory, slug: "call-workflow-planner", purchasedAt: date(35), configuration: { teamName: "Customer Care", routing: "direct", weeklyCalls: 100 }, status: "Expired" },
  { id: "demo-order-generator-005", productId: "generator-receipt-001", name: "Receipt Generator", category: "generator" as CatalogCategory, slug: "receipt-generator", purchasedAt: date(5), configuration: { template: "minimal", brandName: "Northstar Studio", currency: "USD" }, status: "Active" },
  { id: "demo-order-digital-006", productId: "digital-qr-001", name: "QR Code Studio", category: "digital" as CatalogCategory, slug: "qr-code-studio", purchasedAt: date(20), configuration: { destination: "https://northstar.example", style: "branded" }, status: "Pending" },
];
