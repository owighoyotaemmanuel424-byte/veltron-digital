import LegacySignIn from "./legacy-sign-in";

export const dynamic = "force-dynamic";

/**
 * Keep the production sign-in on the existing local session flow until the
 * Neon Better Auth proxy and identity/session bridge have been verified.
 * The Neon UI remains available for testing, but must not hijack live sign-in.
 */
export default function SignInPage() {
  return <LegacySignIn />;
}
