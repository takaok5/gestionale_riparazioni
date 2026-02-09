# Gestionale Riparazioni

## Progetto
Gestionale per la gestione di riparazioni, clienti e fornitori. Monorepo TypeScript full-stack.

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express + Prisma ORM + PostgreSQL
- **Auth**: JWT (access + refresh tokens)
- **Test**: Vitest (unit/integration) + Playwright (e2e)
- **Monorepo**: npm workspaces (`packages/backend`, `packages/frontend`, `packages/shared`)

## Struttura
```
packages/
  backend/     # Express API + Prisma
  frontend/    # React SPA
  shared/      # Tipi e validatori condivisi
docs/
  stories/     # Story files
  sprint-artifacts/
e2e/           # Playwright tests
_bmad/         # Pipeline framework
```

## Comandi
```bash
npm run dev            # Avvia tutto
npm run dev:backend    # Solo backend (porta 3001)
npm run dev:frontend   # Solo frontend (porta 5173)
npm run build          # Build tutti i package
npm run typecheck      # TypeScript check
npm run test           # Tutti i test
npm run test:e2e       # Playwright e2e
```

## Convenzioni
- Lingua UI/commenti: Italiano
- Lingua codice/variabili: Inglese
- Commit messages: Inglese
- Named exports (no `export default`)
- Strict TypeScript (no `any` senza giustificazione)
- Ruoli utente: ADMIN, TECNICO, COMMERCIALE

## Database
- PostgreSQL via Prisma ORM
- Schema in `packages/backend/prisma/schema.prisma`
- Modelli: User, Cliente, Fornitore, AuditLog

## Environment Variables
Vedi `.env.example` per la lista completa.
