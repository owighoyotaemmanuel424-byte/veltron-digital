"use client";

import { createAuthClient } from "@neondatabase/auth/next";

/** Client for the same-origin Neon Better Auth proxy at /api/auth. */
export const neonAuthClient = createAuthClient();
