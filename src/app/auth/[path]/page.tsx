import { AuthView } from "@neondatabase/auth-ui";
import { authViewPaths } from "@neondatabase/auth-ui/server";
import AuthProviders from "@/app/auth-providers";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}

export default async function NeonAuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  if (process.env.NEON_AUTH_ENABLED !== "true") {
    return (
      <main className="auth-shell">
        <div className="eyebrow">AUTHENTICATION PREVIEW</div>
        <h1>Neon Better Auth is not enabled.</h1>
        <p className="lead">Enable NEON_AUTH_ENABLED in the Preview environment after setting the Neon Auth URL and cookie secret.</p>
        <Link href="/sign-in" className="button">Return to current sign in</Link>
      </main>
    );
  }
  if (!Object.values(authViewPaths).includes(path as (typeof authViewPaths)[keyof typeof authViewPaths])) {
    return (
      <main className="auth-shell">
        <h1>Authentication page not found.</h1>
        <Link href="/auth/sign-in">Go to sign in</Link>
      </main>
    );
  }
  return (
    <main className="auth-shell">
      <header className="topbar"><Link className="brand" href="/">veltron<span>.</span></Link><Link href="/">Home</Link></header>
      <section className="auth-card">
        <AuthProviders><AuthView path={path as (typeof authViewPaths)[keyof typeof authViewPaths]} /></AuthProviders>
      </section>
    </main>
  );
}
