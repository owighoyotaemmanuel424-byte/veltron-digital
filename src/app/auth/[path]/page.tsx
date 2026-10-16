import { AuthView } from "@neondatabase/auth-ui";
import { authViewPaths } from "@neondatabase/auth-ui/server";
import AuthProviders from "@/app/auth-providers";
import Link from "next/link";

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
      <main className="vd-auth-page">
        <header className="vd-auth-header">
          <Link className="vd-brand" href="/"><span className="vd-brand-mark">v</span><span>veltron<span className="vd-brand-dot">.</span></span></Link>
          <Link className="vd-auth-back" href="/">← Back to home</Link>
        </header>
        <div className="vd-auth-layout">
          <aside className="vd-auth-story">
            <div className="vd-auth-kicker"><span className="vd-kicker-dot" /> YOUR DIGITAL WORKSPACE</div>
            <h1>Your next move<br />starts <span>here.</span></h1>
            <p>One account for the digital services you use, the work you launch, and the progress you make.</p>
          </aside>
          <section className="vd-auth-form-panel">
            <div className="vd-auth-eyebrow">AUTHENTICATION SETUP</div>
            <h2>Neon sign-in isn’t enabled yet</h2>
            <p className="vd-auth-form-heading">Configure the Neon Auth URL and cookie secret before enabling this sign-in flow.</p>
            <Link href="/sign-in" className="vd-auth-submit">Return to sign in <span>↗</span></Link>
          </section>
        </div>
      </main>
    );
  }
  if (!Object.values(authViewPaths).includes(path as (typeof authViewPaths)[keyof typeof authViewPaths])) {
    return (
      <main className="vd-auth-page">
        <header className="vd-auth-header">
          <Link className="vd-brand" href="/"><span className="vd-brand-mark">v</span><span>veltron<span className="vd-brand-dot">.</span></span></Link>
          <Link className="vd-auth-back" href="/">← Back to home</Link>
        </header>
        <section className="vd-auth-form-panel" style={{ margin: "70px auto" }}>
          <h2>Authentication page not found</h2>
          <Link href="/auth/sign-in" className="vd-auth-submit">Go to sign in <span>↗</span></Link>
        </section>
      </main>
    );
  }
  const normalizedPath = path.toLowerCase();
  const isSignUp = normalizedPath.includes("sign-up") || normalizedPath.includes("sign_up") || normalizedPath.includes("signup");
  return (
    <main className="vd-auth-page">
      <header className="vd-auth-header">
        <Link className="vd-brand" href="/"><span className="vd-brand-mark">v</span><span>veltron<span className="vd-brand-dot">.</span></span></Link>
        <Link className="vd-auth-back" href="/">← Back to home</Link>
      </header>
      <div className={`vd-auth-layout ${isSignUp ? "vd-auth-layout-signup" : ""}`}>
        <aside className="vd-auth-story">
          <div className="vd-auth-kicker"><span className="vd-kicker-dot" /> {isSignUp ? "A BETTER WAY TO GET THINGS DONE" : "YOUR DIGITAL WORKSPACE"}</div>
          <h1>{isSignUp ? <>Make room<br />for <span>what’s next.</span></> : <>Your next move<br />starts <span>here.</span></>}</h1>
          <p>{isSignUp ? "Build your digital workspace and keep your services, orders, and account details connected." : "One account for the digital services you use, the work you launch, and the progress you make."}</p>
          <div className="vd-auth-benefits">
            <div><span className="vd-auth-benefit-icon">{isSignUp ? "✳" : "↗"}</span><span><strong>{isSignUp ? "Start with one simple account" : "Everything in one place"}</strong><small>{isSignUp ? "Get your workspace ready in minutes." : "Services, orders, and account activity."}</small></span></div>
            <div><span className="vd-auth-benefit-icon">⌁</span><span><strong>Security that comes first</strong><small>Private access with account protection.</small></span></div>
          </div>
          <div className="vd-auth-story-foot"><span className="vd-auth-orb" /><span>BUILT FOR YOUR NEXT CHAPTER</span></div>
        </aside>
        <section className="vd-auth-form-panel vd-neon-auth-panel">
          <div className="vd-auth-form-heading">
            <span className="vd-auth-mobile-mark">v.</span>
            <div className="vd-auth-eyebrow">{isSignUp ? "GET STARTED" : "WELCOME BACK"}</div>
            <h2>{isSignUp ? "Create your account" : "Sign in to Veltron"}</h2>
            <p>{isSignUp ? "Join Veltron and set up your workspace." : "Pick up right where you left off."}</p>
          </div>
          <AuthProviders><AuthView path={path as (typeof authViewPaths)[keyof typeof authViewPaths]} /></AuthProviders>
          <p className="vd-auth-legal">Secure account access for your Veltron Digital workspace.</p>
        </section>
      </div>
    </main>
  );
}
