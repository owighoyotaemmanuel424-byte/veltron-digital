import { redirect } from "next/navigation";

// Canonical catalog inventory route. Keep this legacy URL alive as a redirect.
export default function LegacyDashboardProductsPage() {
  redirect("/products");
}
