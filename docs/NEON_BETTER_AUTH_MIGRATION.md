# Neon Managed Better Auth rollout

Veltron Digital now includes a staged Neon Managed Better Auth integration. The app uses Next.js 16 because the selected Neon Auth SDK beta requires Next.js 16 or newer.

## What is implemented

- Neon Auth and Neon Auth UI dependencies.
- Neon UI routes at /auth/sign-in, /auth/sign-up, and other supported Neon auth paths.
- /sign-in and /sign-up route to Neon when NEON_AUTH_ENABLED=true; otherwise they retain the legacy forms.
- Same-origin /api/auth/* proxy and Next.js proxy.ts middleware for Neon session handling and auth callbacks.
- Server-side app session resolution uses Neon sessions when enabled, then maps verified Neon email identities to existing local User records. Existing local role and suspension status remain authoritative. New verified identities receive a CUSTOMER profile and NGN wallet; they cannot self-assign an admin role.
- Sign-out uses Neon Better Auth when enabled.
- Existing PostgreSQL/Prisma business tables and records are not dropped or rewritten by this code change.

## Important migration limitation

Do not enable this for Production yet. Existing local TOTP/recovery-code protection cannot be silently bypassed. For safety, the current mapping refuses access for local accounts with twoFactorEnabled=true until their second factor has a verified migration path to Neon. Existing local passwords and sessions are not portable into Neon, so users will need to establish Neon identities with verified email and use the approved account-linking/onboarding process. Test this with dedicated Preview accounts first.

Neon Auth stores its own identities and sessions in the Neon-managed neon_auth schema. Veltron's business data, orders, wallets, payment records, roles, suspension status, and audit trail remain in the existing Prisma database. A verified email is used only to locate the local business profile; the local role is never taken from Neon metadata.

## Vercel Preview configuration

In the veltron-digital Vercel project, configure the following for Preview only:

- NEON_AUTH_BASE_URL: https://ep-floral-breeze-b5o4y4s0.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth
- NEXT_PUBLIC_NEON_AUTH_URL: the same Neon Auth URL, for the browser SDK.
- NEON_AUTH_COOKIE_SECRET: a newly generated random secret of at least 32 characters. Generate privately with openssl rand -base64 32. Never put it in GitHub or share it in chat.
- NEON_AUTH_ENABLED: set to true in Preview only.

Keep NEON_AUTH_ENABLED=false in Production until Preview validation is complete. Changing Vercel environment variables requires a new deployment. Do not change the existing AUTH_SECRET while legacy sessions may still be in use. Email configuration was not changed.

## Validation checklist

1. Confirm the Preview build installs dependencies and passes TypeScript/Next compilation on Next.js 16.
2. Confirm Neon Auth is enabled for the Neon project and the base URL is correct.
3. Test new user registration, email verification/OTP, sign-in, sign-out, refresh/session persistence, and recovery.
4. Test verified email linking to an existing customer and confirm its local ID, orders, wallets, and payment history are unchanged.
5. Test that suspended/pending accounts cannot access the app and no Neon user can grant themselves ADMIN or SUPER_ADMIN.
6. Test admin/customer API authorization and payment/order endpoints.
7. Resolve the local TOTP migration for existing protected accounts before switching Production.
8. Keep the legacy sign-in routes as a rollback path until the new flow is verified end-to-end.

No Production environment variables have been changed by this code work, and the production auth switch remains off by default.