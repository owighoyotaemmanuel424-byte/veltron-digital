"use client";
import { useRouter } from "next/navigation";
export default function LogoutButton(){const router=useRouter();async function logout(){await fetch("/api/auth/logout",{method:"POST"});router.replace("/sign-in");router.refresh();}return <button className="side-link logout" onClick={logout}>Sign out ↗</button>;}