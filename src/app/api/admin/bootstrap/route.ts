import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { writeAudit } from "@/lib/audit";
export const runtime="nodejs";
const schema=z.object({token:z.string().min(32).max(512),email:z.string().trim().email().max(254),name:z.string().trim().min(1).max(100).optional(),password:z.string().min(16).max(128)});
function matches(a:string,b:string){const ah=createHash("sha256").update(a).digest();const bh=createHash("sha256").update(b).digest();return timingSafeEqual(ah,bh);}
export async function POST(request:NextRequest){
 const expected=process.env.ADMIN_BOOTSTRAP_TOKEN;
 if(!expected||expected.length<32)return NextResponse.json({error:"One-time admin bootstrap is not configured."},{status:404});
 const origin=request.headers.get("origin");const appUrl=process.env.APP_URL;
 if(origin&&appUrl){try{if(new URL(origin).origin!==new URL(appUrl).origin)return NextResponse.json({error:"Origin not allowed."},{status:403});}catch{return NextResponse.json({error:"Origin not allowed."},{status:403});}}
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid request body."},{status:400});}
 const parsed=schema.safeParse(body);if(!parsed.success)return NextResponse.json({error:"Provide the bootstrap token, valid email, and a password of at least 16 characters."},{status:400});
 if(!matches(expected,parsed.data.token))return NextResponse.json({error:"Bootstrap authorization failed."},{status:403});
 const email=parsed.data.email.toLowerCase();
 try{
  const user=await prisma.$transaction(async tx=>{
   const count=await tx.user.count({where:{role:UserRole.SUPER_ADMIN}});
   if(count>0)throw new Error("BOOTSTRAP_ALREADY_USED");
   return tx.user.create({data:{email,name:parsed.data.name,passwordHash:await hashPassword(parsed.data.password),role:UserRole.SUPER_ADMIN,emailVerifiedAt:new Date()},select:{id:true,email:true,name:true,role:true}});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  await createSession(user.id);
  await writeAudit({actorId:user.id,action:"admin.bootstrap",entityType:"User",entityId:user.id,ipAddress:request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()??null,userAgent:request.headers.get("user-agent")??null});
  return NextResponse.json({success:true,user},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if(error instanceof Error&&error.message==="BOOTSTRAP_ALREADY_USED")return NextResponse.json({error:"A super-admin already exists; bootstrap is permanently closed."},{status:409});
  return NextResponse.json({error:"Bootstrap failed. The email may already be registered or the database is unavailable."},{status:503});
 }
}
