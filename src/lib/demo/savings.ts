export type SavingsVaultView = {
  id: string;
  name: string;
  balance: number;
  target: number | null;
  apy: number;
  schedule: "DAILY" | "WEEKLY" | "MONTHLY";
  locked: boolean;
};

export const demoVaults: SavingsVaultView[] = [
  { id: "vault-flex", name: "Flexible Yield", balance: 4200, target: 10000, apy: 4.85, schedule: "MONTHLY", locked: false },
  { id: "vault-emergency", name: "Emergency fund", balance: 1850, target: 5000, apy: 3.9, schedule: "WEEKLY", locked: false },
  { id: "vault-term", name: "12-month locked", balance: 7500, target: null, apy: 7.2, schedule: "MONTHLY", locked: true },
];
