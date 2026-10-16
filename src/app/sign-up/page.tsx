import { redirect } from "next/navigation";
import LegacySignUp from "./legacy-sign-up";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  if (process.env.NEON_AUTH_ENABLED === "true") redirect("/auth/sign-up");
  return <LegacySignUp />;
}
