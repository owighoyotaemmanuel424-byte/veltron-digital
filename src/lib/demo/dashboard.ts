export type DashboardAccount = { id: string; name: string; symbol: string; balance: number; change24h: number; color: string };
export type DashboardTransaction = { id: string; description: string; category: string; date: string; amount: number; status: "Completed" | "Pending" | "Failed"; reference: string };
export const initialAccounts: DashboardAccount[] = [
  { id: "cash", name: "Cash & bank", symbol: "USD", balance: 24850, change24h: 0.3, color: "#4563f7" },
  { id: "crypto", name: "Crypto assets", symbol: "CRYPTO", balance: 18640.5, change24h: 2.8, color: "#16a77a" },
  { id: "savings", name: "Savings vaults", symbol: "USD", balance: 12400, change24h: 0.7, color: "#f5a524" },
  { id: "investments", name: "Investments", symbol: "USD", balance: 8750, change24h: -0.6, color: "#8b5cf6" },
];
export const initialTransactions: DashboardTransaction[] = [
  { id: "TX-8041", description: "Monthly salary", category: "Income", date: "2026-10-27T08:20:00Z", amount: 4250, status: "Completed", reference: "VL-SAL-8041" },
  { id: "TX-8040", description: "Bitcoin purchase", category: "Crypto", date: "2026-10-27T07:45:00Z", amount: -320, status: "Completed", reference: "VL-CRY-8040" },
  { id: "TX-8039", description: "Vault contribution", category: "Savings", date: "2026-10-26T18:30:00Z", amount: -500, status: "Completed", reference: "VL-SAV-8039" },
  { id: "TX-8038", description: "Transfer to Alex", category: "Transfer", date: "2026-10-26T15:12:00Z", amount: -145, status: "Pending", reference: "VL-TRF-8038" },
  { id: "TX-8037", description: "USDC received", category: "Crypto", date: "2026-10-26T11:05:00Z", amount: 890, status: "Completed", reference: "VL-CRY-8037" },
  { id: "TX-8036", description: "Electricity bill", category: "Bills", date: "2026-10-25T16:42:00Z", amount: -84.75, status: "Completed", reference: "VL-BIL-8036" },
  { id: "TX-8035", description: "Online purchase", category: "Shopping", date: "2026-10-25T13:09:00Z", amount: -62.4, status: "Completed", reference: "VL-SHP-8035" },
  { id: "TX-8034", description: "Savings interest", category: "Savings", date: "2026-10-24T23:59:00Z", amount: 38.2, status: "Completed", reference: "VL-SAV-8034" },
  { id: "TX-8033", description: "Exchange withdrawal", category: "Crypto", date: "2026-10-24T10:18:00Z", amount: 1200, status: "Pending", reference: "VL-EXC-8033" },
  { id: "TX-8032", description: "Coffee shop", category: "Card", date: "2026-10-23T09:35:00Z", amount: -8.5, status: "Completed", reference: "VL-CAR-8032" },
];
export const openOrders = [
  { id: "ORD-231", label: "BTC buy order", amount: 240, status: "Open" },
  { id: "ORD-232", label: "Vault transfer", amount: 125, status: "Processing" },
];
export const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
