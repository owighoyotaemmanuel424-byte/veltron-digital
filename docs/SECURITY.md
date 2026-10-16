# Security checklist

## Before public production launch
- Configure a unique random AUTH_SECRET of at least 32 characters and a server-side APP_URL.
- Configure Resend delivery with RESEND_API_KEY and a verified EMAIL_FROM sender; require one-time, expiring email verification before new accounts can sign in.
- Keep durable per-email and per-network registration/login/resend limits enabled; IP values are HMACed before storage. Configure CRON_SECRET in Vercel so daily cleanup removes expired sessions, old verification tokens and stale limiter rows. Device-level controls and monitoring remain outstanding.
- Single-use TOTP recovery codes are now issued as hashes and consumed atomically at sign-in. Still add password reset, account recovery, and a verified process for changing or disabling two-factor authentication.
- Review origin/CSRF protection for every state-changing route and apply least-privilege authorization server-side.
- Restrict the one-time /api/admin/bootstrap endpoint to a high-entropy ADMIN_BOOTSTRAP_TOKEN, use it once, then remove the environment variable.
- Keep production secrets out of GitHub, browser bundles, logs, and error messages.
- Require MFA for privileged accounts and review admin role changes.
- Use append-only audit events for sensitive actions; restrict access to audit records.
- Back up PostgreSQL and review all migrations before deployment. Never reset or truncate production data as a deployment shortcut.

## Payments and wallet ledger
- Do not activate payment initialization until merchant eligibility and credentials are confirmed.
- Verify provider-side transaction status, reference, amount, currency, and order association.
- Treat webhooks as untrusted input until signatures are verified; deduplicate event IDs and reconcile through the provider API.
- Post wallet movements in a single database transaction with idempotency keys and balanced debit/credit entries. Never trust a client-provided balance.
- Do not fulfill orders or issue refunds from an unverified redirect or webhook body.

## External integrations
- Keep telephony and hosting provider credentials server-side.
- Validate provider callback signatures and replay protection before changing site or call state.
- Enforce quotas, consent requirements, abuse controls, and spending limits before enabling voice or AI calls.
- Generated documents must be truthful, clearly identify their issuer, and must not impersonate a bank, payment provider, or third party.
