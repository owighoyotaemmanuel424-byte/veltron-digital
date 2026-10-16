import LegacySignUp from "./legacy-sign-up";

export const dynamic = "force-dynamic";

/**
 * Keep production registration on the existing local account flow until the
 * Neon Better Auth proxy and identity/session bridge have been verified.
 */
export default function SignUpPage() {
  return <LegacySignUp />;
}
