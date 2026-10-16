import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/app/dashboard/logout-button";
import AdminManagement from "./admin-management";
export const dynamic="force-dynamic";
export default async function AdminPage(){
 const user=await getSessionUser();
 if(!user)redirect("/sign-in");
 if(user.role!=="ADMIN"&&user.role!=="SUPER_ADMIN")redirect("/dashboard");
 const [users,activeUsers,orders,payments,pendingPayments,audit]=await Promise.all([
 prisma.user.count(),prisma.user.count({where:{status:"ACTIVE"}}),prisma.order.count(),prisma.payment.count(),prisma.payment.count({where:{status:{in:["INITIALIZED","PENDING"]}}}),
 prisma.auditLog.findMany({select:{id:true,action:true,entityType:true,outcome:true,createdAt:true,actor:{select:{email:true}}},orderBy:{createdAt:"desc"},take:8})
 ]);
 return <main className="workspace"><aside className="side-nav"><Link className="brand" href="/">veltron<span>.</span></Link><p className="side-label">ADMINISTRATION</p><Link className="side-link active" href="/admin">Overview</Link><Link className="side-link" href="/dashboard">Customer workspace</Link><Link className="side-link" href="/services">Service catalog</Link><div className="side-bottom"><span className="side-foot">{user.email}</span><LogoutButton/></div></aside><section className="workspace-main"><header className="workspace-header"><div><div className="eyebrow">ADMIN CONTROL CENTER</div><h1>Platform overview.</h1><p className="lead">Live operational counts from PostgreSQL. Financial settlement and provider fulfilment remain gated until reconciled.</p></div><span className="status-chip">● Authorized</span></header>
 <div className="dashboard-grid"><article className="dash-card"><span className="dash-label">Registered users</span><strong>{users}</strong><span className="dash-note">{activeUsers} active accounts</span></article><article className="dash-card"><span className="dash-label">Orders</span><strong>{orders}</strong><span className="dash-note">All recorded order statuses</span></article><article className="dash-card"><span className="dash-label">Payment records</span><strong>{payments}</strong><span className="dash-note">{pendingPayments} initialized or pending</span></article></div>
 <section className="dash-section"><div className="section-heading"><div><div className="eyebrow">AUDITABILITY</div><h2>Recent audit events</h2></div></div>{audit.length?<div className="table-wrap"><table><thead><tr><th>Action</th><th>Entity</th><th>Actor</th><th>Outcome</th><th>Time</th></tr></thead><tbody>{audit.map(event=><tr key={event.id}><td>{event.action}</td><td>{event.entityType}</td><td>{event.actor?.email??"System"}</td><td>{event.outcome.toLowerCase()}</td><td>{event.createdAt.toLocaleString("en")}</td></tr>)}</tbody></table></div>:<div className="empty-state"><h3>No audit events yet</h3><p>Account events will appear here as the platform is used.</p></div>}</section>
 <AdminManagement currentUserId={user.id} isSuperAdmin={user.role === "SUPER_ADMIN"} />
 <section className="dash-section"><div className="card"><div className="eyebrow">SAFE OPERATIONS</div><h2>Payments are not marked successful by webhook receipt alone.</h2><p>Provider verification, amount/currency/order matching, idempotent posting, and reconciliation must be implemented and tested before enabling wallet funding or fulfilment.</p><p className="small-copy">Implementation and launch limitations are documented in docs/PLATFORM_ROADMAP.md in the repository.</p></div></section></section></main>;
}