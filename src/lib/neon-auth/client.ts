"use client";

import { createAuthClient } from "@neondatabase/auth/next";

/**
 * Neon client uses the SDK's same-origin Next.js auth proxy at /api/auth.
 * Existing /sign-in and /sign-up flows remain on the legacy auth system until
 * the identity-to-local-user mapping and role checks are implemented.
 */
export const neonAuthClient = createAuthClient();
