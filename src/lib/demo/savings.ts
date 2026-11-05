export type SavingsFrequency = "daily" | "weekly" | "monthly";
export type SavingsVault = {
  id: string;
  name: string;
  current: number;
  target: number;
  apy: number;
  wallet: string;
  status: "active" | "paused";
  nextDeposit: string | null;
  rule: { amount: number; frequency: SavingsFrequency; wallet: string } | null;
};

const dateAfter = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export const demoVaults: SavingsVault[] = [
  {
    id: "vault-emergency",
    name: "Emergency fund",
    current: 3250,
    target: 6000,
    apy: 4.5,
    wallet: "Everyday wallet",
    status: "active",
    nextDeposit: dateAfter(3),
    rule: { amount: 100, frequency: "weekly", wallet: "Everyday wallet" },
  },
  {
    id: "vault-travel",
    name: "Summer getaway",
    current: 840,
    target: 2500,
    apy: 3.9,
    wallet: "Income wallet",
    status: "active",
    nextDeposit: dateAfter(1),
    rule: { amount: 25, frequency: "daily", wallet: "Income wallet" },
  },
  {
    id: "vault-home",
    name: "Home deposit",
    current: 7200,
    target: 15000,
    apy: 4.75,
    wallet: "Primary wallet",
    status: "paused",
    nextDeposit: dateAfter(7),
    rule: { amount: 250, frequency: "monthly", wallet: "Primary wallet" },
  },
  {
    id: "vault-learning",
    name: "Learning fund",
    current: 410,
    target: 1000,
    apy: 4.1,
    wallet: "Everyday wallet",
    status: "active",
    nextDeposit: dateAfter(5),
    rule: { amount: 30, frequency: "weekly", wallet: "Everyday wallet" },
  },
];

export type GrowthPoint = { label: string; projected: number; actual: number };

export const demoGrowth: GrowthPoint[] = [
  { label: "May", projected: 8200, actual: 8060 },
  { label: "Jun", projected: 8380, actual: 8290 },
  { label: "Jul", projected: 8570, actual: 8440 },
  { label: "Aug", projected: 8760, actual: 8610 },
  { label: "Sep", projected: 8960, actual: 8790 },
  { label: "Oct", projected: 9160, actual: 9025 },
  { label: "Nov", projected: 9370, actual: 9190 },
  { label: "Dec", projected: 9580, actual: 9470 },
  { label: "Jan", projected: 9800, actual: 9685 },
  { label: "Feb", projected: 10020, actual: 9910 },
  { label: "Mar", projected: 10250, actual: 10115 },
  { label: "Apr", projected: 10480, actual: 10380 },
  { label: "May", projected: 10720, actual: 10610 },
];
