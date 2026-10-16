import { NextRequest, NextResponse } from "next/server";
import { getNeonAuth } from "@/lib/neon-auth/server";

export default async function proxy(request: NextRequest) {
  if (process.env.NEON_AUTH_ENABLED !== "true") return NextResponse.next();

  try {
    return await getNeonAuth().middleware({ loginUrl: "/auth/sign-in" })(request);
  } catch {
    // Fail closed for protected pages if Neon Auth is enabled but misconfigured.
    if (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/auth/sign-in", request.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
