export default function SignInPage() {
  return <main><header className="topbar"><a className="brand" href="/">veltron<span>.</span></a><a href="/">Home</a></header>
    <section className="section" style={{maxWidth:520,paddingTop:72}}><div className="eyebrow">Welcome back</div><h1 style={{fontSize:44}}>Sign in</h1>
      <p className="lead">Authentication is not enabled yet. This placeholder prevents an incomplete login flow from being mistaken for a production-ready sign-in.</p>
      <div className="card"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" disabled placeholder="you@example.com" style={{display:"block",width:"100%",margin:"8px 0 18px",padding:12,background:"#080a0f",border:"1px solid #30394b",borderRadius:10,color:"white"}}/>
      <label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" disabled placeholder="••••••••" style={{display:"block",width:"100%",margin:"8px 0 18px",padding:12,background:"#080a0f",border:"1px solid #30394b",borderRadius:10,color:"white"}}/>
      <button className="button" disabled style={{opacity:.5,width:"100%"}}>Sign in (not enabled)</button></div>
    </section></main>;
}
