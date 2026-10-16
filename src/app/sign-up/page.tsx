export default function SignUpPage() {
  return <main><header className="topbar"><a className="brand" href="/">veltron<span>.</span></a><a href="/">Home</a></header>
    <section className="section" style={{maxWidth:520,paddingTop:72}}><div className="eyebrow">Get started</div><h1 style={{fontSize:44}}>Create your account</h1>
      <p className="lead">Registration remains disabled until rate limiting, email verification, secure sessions, and account recovery are implemented.</p>
      <div className="card"><p>The next milestone is secure account creation followed by a protected customer dashboard.</p><a className="button secondary" href="/sign-in">Back to sign in</a></div>
    </section></main>;
}
