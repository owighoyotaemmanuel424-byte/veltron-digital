export type ReceiptVariant = "crypto" | "bank" | "store";

export type DemoDocument = {
  id: string;
  orderId: string;
  title: string;
  variant: ReceiptVariant;
  issuedAt: string;
  merchant: string;
  amount: number;
  currency: "USD";
  reference: string;
  txHash?: string;
  paymentMethod: string;
  status: "Demo" | "Pending";
  items?: { label: string; amount: number }[];
};

const ago = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

export const demoDocuments: DemoDocument[] = [
  {
    id: "doc-store-001", orderId: "demo-order-generator-005", title: "Store receipt sample",
    variant: "store", issuedAt: ago(5), merchant: "Northstar Studio (Demo)",
    amount: 48.5, currency: "USD", reference: "DEMO-STORE-1048",
    paymentMethod: "Demo checkout", status: "Demo",
    items: [{ label: "Sample product A", amount: 29.5 }, { label: "Sample product B", amount: 19 }],
  },
  {
    id: "doc-crypto-002", orderId: "demo-order-generator-crypto-002", title: "Crypto transaction sample",
    variant: "crypto", issuedAt: ago(3), merchant: "Veltron Sandbox",
    amount: 0.025, currency: "USD", reference: "DEMO-CRYPTO-002",
    txHash: "DEMO-HASH-NOT-A-REAL-TRANSACTION", paymentMethod: "Simulated crypto transfer", status: "Demo",
  },
  {
    id: "doc-bank-003", orderId: "demo-order-generator-bank-003", title: "Bank payment receipt sample",
    variant: "bank", issuedAt: ago(1), merchant: "Northstar Demo Services",
    amount: 125, currency: "USD", reference: "DEMO-BANK-0125",
    paymentMethod: "Simulated bank transfer", status: "Pending",
  },
];

export function documentForGeneratorOrder(order: {
  id: string; name: string; slug: string; purchasedAt: string;
  configuration: Record<string, unknown>;
}): DemoDocument {
  const slug = order.slug.toLowerCase();
  const variant: ReceiptVariant = slug.includes("crypto") ? "crypto" : slug.includes("bank") ? "bank" : "store";
  const title = variant === "crypto" ? "Crypto receipt preview" : variant === "bank" ? "Bank receipt preview" : "Store receipt preview";
  const amountValue = Number(order.configuration.amount);
  const amount = Number.isFinite(amountValue) && amountValue >= 0 && amountValue < 10000 ? amountValue : 24.99;
  return {
    id: "doc-" + order.id,
    orderId: order.id,
    title,
    variant,
    issuedAt: order.purchasedAt,
    merchant: "Veltron Demo Workspace",
    amount,
    currency: "USD",
    reference: "DEMO-" + order.id.replace(/[^a-z0-9]/gi, "").slice(-12).toUpperCase(),
    ...(variant === "crypto" ? { txHash: "DEMO-HASH-NOT-A-REAL-TRANSACTION" } : {}),
    paymentMethod: "Simulated demo payment",
    status: "Demo",
    items: [{ label: order.name + " (sample)", amount }],
  };
}
