"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
export default function VerifyEmailPage() {
 const [message,setMessage]=useState("Checking your verification link…");const [error,setError]=useState(false);const started=useRef(false);
 useEffect(()=>{if(started.current)return;started.current=true;const token=new URLSearchParams(window.location.search).get("token");if(!token){setError(true);setMessage("This verification link is missing or invalid. Request a new one from sign-up.");return;}fetch("/api/auth/verify-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||"Verification failed.");setMessage(data.message||"Email verified. You can now sign in.");}).catch(e=>{setError(true);setMessage(e instanceof Error?e.message:"Verification failed. Request a new link.");});},[]);
 return <main><header className="topbar"><Link className="brand" href="/">veltron<span>.</span></Link><Link href="/">Home</Link></header><section className="auth-shell"><div className="eyebrow">EMAIL VERIFICATION</div><h1>{error?"Verification link unavailable":"Verify your email."}</h1><p role={error?"alert":"status"} className={error?"form-error":"lead"}>{message}</p><p className="auth-foot"><Link href="/sign-in">Continue to sign in</Link> · <Link href="/sign-up">Request another link</Link></p></section></main>;
}
