# GlobalgleHQ parity implementation tracker

Reference: `GlobalgleHQ_Complete_Technical_Documentation.pdf` (v1.0.0, inspection date 2026-10-16). This is a functional and visual reference, not a source-code or branding copy. Preserve Veltron Digital identity and existing Next.js/Prisma/PostgreSQL architecture.

## Reference UI system

- Dashboard canvas: near-black `#090d16`, elevated cards `#111827`, fine borders, high-contrast text, compact typography, inline SVG-style icons.
- Responsive shell: top bar with mobile hamburger, categorized tool navigation, profile drawer, theme selector, NGN indicator and account actions.
- Dashboard: wallet/plan/payment summary cards; prominent action buttons; categorized quick-action matrix; four-column transaction history (date, type/method, amount, status).
- Authentication: login and registration forms, clear validation and rate limiting.
- Mobile: touch-friendly cards and navigation; avoid floating action overlap at widths below 380px.
- Admin: user controls, pricing/catalog controls and financial reconciliation are described as an inferred/proposed architecture, not verified live UI.

## Feature parity matrix

Statuses describe Veltron repository state at the start of this parity effort, not promises of production availability.

| Reference capability | Veltron state | Safe implementation target |
| --- | --- | --- |
| Account registration, login, session logout | Implemented foundation | Match reference form hierarchy and validate flows end-to-end |
| Email verification | Implemented; requires verified sender/provider config | Test delivery and resend abuse controls |
| Customer dashboard and wallet display | Dashboard reads PostgreSQL records | Match compact summary cards, activity tables and mobile shell |
| Dark/light theme toggle | Dark theme present; no verified persisted toggle | Add accessible theme control and persist preference safely |
| Categorized quick-action matrix | Active catalog services only | Map real implemented routes to categories; label unavailable integrations honestly |
| Wallet top-up through KoraPay | Not enabled; Paystack disabled pending credentials/eligibility | Select approved provider; implement signed callbacks, idempotency and reconciliation before credits |
| Subscription plans | Not configured | Add real plan model, checkout and entitlements only after reviewed billing flow |
| Website creator templates | Private editable drafts for portfolio, business and landing page | Add templates and preview interactions; publishing/domain/DNS/SSL require provider integration |
| Domain search/purchase and webmail | Not integrated | Registrar/email provider selection, quote/checkout/provisioning and verified callbacks |
| Broker, online-banking-themed, e-commerce, giveaway/investment, celebrity, widget, support, tracking, transaction tracker, wallet sites | Not implemented as provisioned products | Implement legitimate templates and publish workflow; prohibit deceptive financial impersonation |
| Bank/crypto/store receipt generators | Document drafts foundation; no live financial receipt generation | Generate clearly marked sample/recordkeeping documents; never fabricate proof of payment or bank records |
| SMS sender and SMS verification | Provider dispatch not integrated | Provider adapter, country/service pricing, quota, delivery states and secure callbacks |
| eSIM provisioning | Not integrated | Provider adapter and inventory/activation lifecycle |
| Account marketplace / account verification | Not integrated | Define lawful inventory and verification policy before build; no credential resale or account compromise |
| Custom caller ID, voice notes, crypto mail/bills mail, bank mailer | Not integrated | Provider-dependent communications with consent, abuse controls and delivery audit |
| Customer support ticketing / Telegram deep link | Not verified in current routes | Support tickets, privacy-safe status and configured official support destination |
| Admin user management and catalog | Partial admin foundation exists | Add clear staff roles, safe account controls, pricing history and audit trails |
| Financial reconciliation | Not implemented | Immutable provider event log, unique event references, double-entry ledger and review queue |
| Notifications, monitoring and operational dashboards | Partial foundation only | Delivery provider, error monitoring and transaction-drop alerts |
| API reseller access | Not implemented | API key lifecycle, scopes, usage limits, idempotency and ledger-backed billing |

## Delivery order

1. **Visual shell parity:** dashboard navigation, theme control, summary cards, action matrix, tables, mobile spacing and 320–380px overflow.
2. **Core account workflows:** sign-in/register/verification, profile/security and support entry point; add end-to-end coverage.
3. **Website creator:** reusable templates, editing, preview, saving and publishing lifecycle with provider boundaries explicit.
4. **Catalog-backed tools:** build provider-neutral service adapters and statuses; never display a tool as live without working provider configuration.
5. **Money movement:** approved payment provider, signed webhook verification, idempotent unique event handling, double-entry ledger and reconciliation; keep disabled until tested.
6. **Administration and operations:** staff roles, audit log, catalog/pricing, user controls, event review, alerts and responsive admin UI.
7. **Release gates:** typecheck, lint, tests, migration review, preview deployment smoke tests, and production checks without mutating financial records.

## Safety and integrity gates

- Never seed demo balances or fabricate successful payment/order states.
- Never enable wallet credit/debit without a reviewed ledger posting service and idempotent, verified provider events.
- Do not claim domain, webmail, SMS, eSIM, voice or payment functionality is live until provider credentials, callback verification and integration tests pass.
- Keep secrets server-side; use additive migrations and preserve existing user and financial records.
- Keep the Globalgle reference's terminology and interaction patterns, while retaining Veltron branding and implementing original code.
