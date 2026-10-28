# Platform architecture

Two deployables, one docker-compose stack.

```
veltron-digital/
├── src/                     Next.js 16 App Router frontend (existing app)
│   ├── app/catalog/         Product hub: search, category filters, quick-view + activation modals
│   ├── app/(app)/           Authenticated workspace: dashboard, crypto, savings, analytics, settings
│   ├── app/admin/           Super-admin portal
│   └── components/          shadcn/Radix primitives, catalog hub, crypto widgets
├── services/platform/       Node/Express API gateway, WS engine, vault daemon
│   ├── prisma/schema.prisma Postgres schema (UUID PKs, numeric money, double-entry postings)
│   └── src/
│       ├── routes/          auth · catalog · wallets · vaults · orders · admin
│       ├── services/        ledger (double-entry) · vaults (accrual)
│       ├── realtime/        matching engine + WebSocket server
│       ├── lib/             money (BigInt 1e-8) · jwt · rate-limit · telegram · totp
│       └── worker.ts        BullMQ hourly accrual daemon
├── nginx/nginx.conf         Reverse proxy: `/` → web, `/v1` → api, `/ws` → api (upgrade)
├── Dockerfile.web           Next.js image (prisma generate + next build)
└── docker-compose.yml       postgres · redis · api · worker · web · nginx
```

## Money and the ledger

All arithmetic happens in **integer minor units (1e-8)**; `Prisma.Decimal` is only used at
the persistence edge. `services/platform/src/services/ledger.ts` enforces:

1. **At least two postings**, each in a `wallet:<uuid>` or `system:<name>` namespace.
2. **Per-currency balance**: every currency in a group sums to exactly zero.
3. **Append-only**: there is no update/delete path; corrections are new offsetting groups.
4. **Idempotency**: `ledger_transactions.reference` is unique. A retried request returns the
   existing group instead of double-posting (`created: false`).
5. **Availability vs. money**: locking funds for an open order moves `balance → locked_balance`
   without a posting; settlement posts the real pair.

`POST /v1/wallets/withdraw` demonstrates a three-way split: wallet debit, external payout credit,
and fee-income credit, netting to zero.

## Matching engine and WebSocket protocol

`MarketEngine` keeps an authoritative book per symbol, mean-reverts prices on a timer, matches
crossing limit orders and emits `ticker` / `book` / `fill` / `orders` events. `realtime/server.ts`
relays those to subscribed sockets and pings every 30s to drop half-open connections.

```
client → { "type": "subscribe", "symbols": ["BTC", "ETH"] }
server → { "type": "snapshot",  "payload": { "tickers": [...], "book": {...} } }
server → { "type": "ticker",    "payload": { "symbol": "BTC", "price": 67012.4, ... } }
server → { "type": "book",      "payload": { "symbol": "BTC", "bids": [...], "asks": [...], "spread": 1.2 } }
server → { "type": "fill",      "payload": { "orderId": "...", "price": 67012.4, "quantity": 0.5 } }
client → { "type": "ping" }
```

Clients should reconnect with exponential backoff (1s → 30s, jittered) and resubscribe; the
snapshot frame restores book state, so no local replay is needed.

## Vault daemon

`worker.ts` runs `vault-accrual` hourly (BullMQ repeatable job when `REDIS_URL` is set, in-process
interval otherwise). Interest is `balance × APY × hours / 8760`, integer half-up. Each vault-hour
posts one balanced group with reference `vault-interest:<vaultId>:<ISO hour>`, so a retried or
duplicated job cannot credit twice.

## API surface

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/v1/auth/register` | – | Create user + USD/USDT wallets |
| POST | `/v1/auth/login` | – | Password, plus TOTP when enrolled |
| POST | `/v1/auth/refresh` | – | Rotate access token |
| POST | `/v1/auth/2fa/enroll` \| `/2fa/confirm` | bearer | TOTP pairing + otpauth URL |
| POST | `/v1/auth/telegram/webhook` | HMAC + secret token | Bot updates |
| GET | `/v1/catalog` | – | Active products by category |
| GET | `/v1/wallets` | bearer | Balances + locked balances |
| POST | `/v1/wallets/deposit` \| `/withdraw` | bearer | Ledger-backed movements |
| GET/POST | `/v1/vaults`, `/v1/vaults/:id/deposit` | bearer | Vault lifecycle |
| GET/POST/DELETE | `/v1/orders` | bearer | Engine orders, funds locked/released |
| GET | `/v1/admin/users`, `/kyc` | ADMIN | Customer + KYC queue |
| POST | `/v1/admin/adjustments`, `/kyc/:id/review` | ADMIN | Manual ledger adjustments |
| PATCH | `/v1/admin/catalog/:id` | ADMIN | Fee/APY rate modifier |

## Running the stack

```bash
cp services/platform/.env.example services/platform/.env   # local API runs
docker compose up --build                                  # full stack behind nginx on :8080
```

In the container stack nginx is the only public port. `/health` and `/ready` are unauthenticated
so compose and orchestrators can probe them.

## Known gaps

- The Next.js screens are still fed by the in-repo demo data (`src/lib/demo/*`); only the
  `/catalog` hub and the existing auth forms are UI-complete against the API contract.
- KYC document upload (multipart) and Telegram bot provisioning are modelled in the schema and
  admin routes but not wired to a file store.
- The matching engine is in-memory per instance; horizontal scaling needs a Redis-backed book.
