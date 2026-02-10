# Gestionale Riparazioni

## Stack
- **Language:** TypeScript ^5.7.0 (strict mode)
- **Runtime:** Node.js (ES2022 target)
- **Backend:** Express ^4.21.0 + Prisma ^6.3.0 + PostgreSQL
- **Frontend:** React ^18.3.0 + Vite ^6.1.0 + Tailwind CSS ^3.4.0 + shadcn/ui
- **Auth:** JWT (access 15min + refresh 7d) + bcryptjs (salt 12)
- **Validation:** Zod ^3.24.0 (shared frontend/backend)
- **Test:** Vitest ^3.0.0 + Supertest (backend), Vitest + Testing Library (frontend), Playwright (E2E)
- **Monorepo:** npm workspaces

## Commands
```bash
npm run dev            # Avvia tutto (backend + frontend)
npm run dev:backend    # Solo backend (porta 3001)
npm run dev:frontend   # Solo frontend (porta 5173)
npm run build          # Build tutti i package
npm run typecheck      # TypeScript check
npm run lint           # Lint tutti i package
npm run test           # Tutti i test
npm run test:e2e       # Playwright E2E
```

## Structure
```
packages/
  backend/             # Express API + Prisma
    src/
      routes/          # Endpoint REST (/api/*)
      middleware/       # auth, audit, validate, rate-limit, error-handler
      services/        # Business logic (auth, riparazione, preventivo, fattura, magazzino, email, pdf, stripe)
      lib/             # prisma client, logger, config
      types/           # Express augmentation
    prisma/            # schema.prisma + migrations + seed
    templates/         # HTML templates (preventivo, fattura, etichetta, email)
  frontend/            # React SPA
    src/
      components/      # layout/ + shared/ + ui/ (shadcn)
      pages/           # Route pages (riparazioni, clienti, fornitori, preventivi, fatture, magazzino, ordini, report, utenti, audit-log)
      hooks/           # useAuth, useApi, usePagination
      contexts/        # AuthContext
      lib/             # api client, utils
      types/
  shared/              # Tipi e validatori condivisi
    src/
      types/           # All shared types + enums
      validators/      # Zod schemas
docs/                  # Documentazione progetto
  epics/               # Epic shardati (epic-1-*.md ... epic-7-*.md)
  stories/             # Story files (generati da story-pipeline)
  sprint-artifacts/    # Sprint artifacts
.claude/
  plans/               # Piani implementativi generati dalla story-pipeline
e2e/                   # Playwright E2E tests
_bmad/                 # Pipeline framework
```

## Conventions
- **Lingua UI/commenti:** Italiano
- **Lingua codice/variabili:** Inglese
- **Commit messages:** Inglese
- **Named exports only** (no `export default`)
- **Strict TypeScript** (no `any` senza giustificazione)
- **Ruoli utente:** ADMIN, TECNICO, COMMERCIALE
- **Zod validation** su ogni API endpoint
- **Prisma explicit select** (no SELECT *)
- **Server-side pagination** su tutti i list endpoint (default 50, max 100)
- **Business logic** nei services (non nei route handler)
- **Standard error format:** `{ error: { code, message, details } }`
- **Standard success format:** `{ data, meta: { page, limit, total } }`

## Database
- PostgreSQL via Prisma ORM
- Schema in `packages/backend/prisma/schema.prisma`
- 16 entita: User, Cliente, Fornitore, Riparazione, RiparazioneStato, Preventivo, VocePreventivo, Fattura, Pagamento, Articolo, MovimentoMagazzino, OrdineFornitore, VoceOrdine, RicezioneOrdine, Notifica, AuditLog
- Enum: Role, TipoCliente, CategoriaFornitore, StatoRiparazione (10 stati), Priorita, StatoPreventivo, TipoVoce, StatoFattura, MetodoPagamento, TipoMovimento, StatoOrdine, TipoNotifica, StatoNotifica

## Naming
- Files backend: `kebab-case.ts`
- Files frontend components: `PascalCase.tsx`
- Files frontend hooks/utils: `camelCase.ts`
- Variables/Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase` (no I prefix)
- Enums: `PascalCase` with `UPPER_SNAKE_CASE` values
- React Components: `PascalCase`
- Express Routes: `kebab-case` (e.g., `/api/audit-log`)

## Forbidden Anti-Patterns
- `any` without justifying comment
- `console.log` in production (use structured logger)
- Inline styles in React (use Tailwind)
- Inline objects/functions in JSX props
- useEffect without explicit deps array
- N+1 queries (use Prisma include/select)
- Direct mutation of `giacenza` (only via MovimentoMagazzino)
- SELECT * in Prisma queries

## Environment Variables
Vedi `.env.example` per la lista completa.
