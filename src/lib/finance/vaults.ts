export type VaultSchedule = "DAILY" | "WEEKLY" | "MONTHLY";

/** A savings vault exactly as the platform API reports it. */
export type SavingsVaultView = {
  id: string;
  name: string;
  balance: number;
  target: number | null;
  apy: number;
  schedule: VaultSchedule;
  locked: boolean;
};
