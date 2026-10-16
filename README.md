# Veltron Digital

Original service-marketplace platform foundation built with Next.js App Router, TypeScript, PostgreSQL, and Prisma.

## Status
This repository is an initial scaffold, not yet production-ready. Authentication and sessions, customer/admin dashboards, service/order workflows, verified payment reconciliation, authorization enforcement, and full integration tests must be completed before real customers or payments are enabled.

## Stack
- Next.js + TypeScript
- PostgreSQL + Prisma
- Vercel deployment target
- Paystack planned, pending merchant eligibility and credentials

## Local development
1. Use Node.js 20+ and a development PostgreSQL database.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.
3. Run `npm install`, `npx prisma generate`, `npx prisma migrate dev --name init`, then `npm run dev`.

## Security requirements
- Never commit credentials, production data, or real customer records.
- Do not activate Paystack until merchant eligibility is confirmed and server-side credentials are configured.
- Never trust browser redirects or webhook payloads alone to mark payments successful.
- Verify provider reference, amount, currency, and order association; make state changes idempotent and transactional.
- Do not expose admin routes until server-side authorization and secure sessions are implemented.
- Provision the first super-admin using a one-time protected bootstrap; never hardcode admin credentials.
- Use reviewed Prisma migrations; never run destructive schema resets against production.

See [docs/SECURITY.md](docs/SECURITY.md) for the readiness checklist.
