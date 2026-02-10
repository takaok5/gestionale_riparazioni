# packages/backend

## Role
Express REST API server con Prisma ORM. Gestisce autenticazione JWT, RBAC, business logic delle riparazioni, preventivi, fatture, magazzino, ordini, notifiche e audit log.

## Pattern
- **Route → Middleware → Service → Prisma**: ogni route chiama il service per la logica
- **Zod validation middleware** su ogni endpoint (shared validators da `@gestionale/shared`)
- **JWT middleware** (`authenticate` + `authorize(roles)`) su tutte le route protette
- **Audit middleware** logga automaticamente le operazioni CRUD
- **Prisma transactions** per operazioni multi-step (es. cambio stato riparazione + log)
- **Explicit select** in tutte le query Prisma (mai SELECT *)
- **Pagination standard**: `?page=1&limit=50` con `{ data, meta: { page, limit, total } }`
- **Error handling centralizzato** via `error-handler.ts`

## Key Files
- `src/index.ts` — Entry point Express
- `src/app.ts` — Express app setup (middleware, routes)
- `src/routes/` — Tutti gli endpoint REST
- `src/middleware/auth.ts` — JWT authenticate + authorize
- `src/services/riparazione.service.ts` — Workflow 10 stati con transizioni validate
- `prisma/schema.prisma` — Schema database (16 entita)
- `prisma/seed.ts` — Seed data

## Anti-Pattern
- NO business logic nei route handler (sempre nei services)
- NO `console.log` (usare structured logger)
- NO `any` senza commento giustificativo
- NO query senza explicit select
- NO mutazione diretta di `giacenza` (solo via MovimentoMagazzino)
- NO password in plain text nei log o response

_See root CLAUDE.md for global rules_
