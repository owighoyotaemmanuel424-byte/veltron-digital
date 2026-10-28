import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

export type Role = "USER" | "ADMIN" | "SUPER_ADMIN";
export type AccessClaims = { sub: string; role: Role; email: string; typ: "access" };
export type RefreshClaims = { sub: string; typ: "refresh"; jti: string };

export const roleRank: Record<Role, number> = { USER: 1, ADMIN: 2, SUPER_ADMIN: 3 };

export function signAccessToken(secret: string, ttlSeconds: number, claims: Omit<AccessClaims, "typ">): string {
  return jwt.sign({ ...claims, typ: "access" }, secret, { expiresIn: ttlSeconds, algorithm: "HS256" });
}

export function signRefreshToken(secret: string, ttlSeconds: number, userId: string): string {
  return jwt.sign({ sub: userId, typ: "refresh", jti: crypto.randomUUID() }, secret, {
    expiresIn: ttlSeconds,
    algorithm: "HS256",
  });
}

export function verifyToken<T extends AccessClaims | RefreshClaims>(secret: string, token: string): T {
  return jwt.verify(token, secret, { algorithms: ["HS256"] }) as T;
}

declare module "express-serve-static-core" {
  interface Request {
    auth?: { userId: string; role: Role; email: string };
  }
}

export function bearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export function createAuthMiddleware(secret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = bearerToken(req.headers.authorization);
    if (!token) {
      res.status(401).json({ error: "missing_bearer_token" });
      return;
    }
    try {
      const claims = verifyToken<AccessClaims>(secret, token);
      if (claims.typ !== "access") {
        res.status(401).json({ error: "invalid_token_type" });
        return;
      }
      req.auth = { userId: claims.sub, role: claims.role, email: claims.email };
      next();
    } catch {
      res.status(401).json({ error: "invalid_or_expired_token" });
    }
  };
}

export function requireRole(minimum: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      res.status(401).json({ error: "unauthenticated" });
      return;
    }
    if (roleRank[req.auth.role] < roleRank[minimum]) {
      res.status(403).json({ error: "insufficient_role", required: minimum });
      return;
    }
    next();
  };
}
