import { redirect } from "next/navigation";
import LegacySignIn from "./legacy-sign-in";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  if (process.env.NEON_AUTH_ENABLED === "true") redirect("/auth/sign-in");
  return <LegacySignIn />;
}
