---
story_id: '1.3'
created: '2026-02-10T12:08:05+01:00'
depends_on: ['1.1', '1.2']
files_modified:
  - packages/backend/src/routes/users.ts
  - packages/backend/src/services/users-service.ts
  - packages/backend/src/index.ts
  - packages/backend/src/middleware/auth.ts
  - packages/backend/src/__tests__/users-create.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 1.3

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/src/services/users-service.ts` | implementare creazione utente con validazione input, hash password, mapping errori dominio (`USERNAME_EXISTS`, `VALIDATION_ERROR`) | `packages/backend/prisma/schema.prisma`, `packages/backend/src/lib/errors.ts` |
| `packages/backend/src/routes/users.ts` | creare endpoint `POST /api/users` con `authenticate` + `authorize("ADMIN")`, mapping service result -> status HTTP | `packages/backend/src/services/users-service.ts`, `packages/backend/src/middleware/auth.ts` |
| `packages/backend/src/middleware/auth.ts` | uniformare risposta `403` al formato `buildErrorResponse("FORBIDDEN", ...)` senza rompere comportamento auth esistente | `packages/backend/src/lib/errors.ts` |
| `packages/backend/src/index.ts` | registrare `usersRouter` su `/api/users` mantenendo ordine middleware globale | `packages/backend/src/routes/users.ts` |
| `packages/backend/src/__tests__/users-create.spec.ts` | adattare test RED a GREEN e stabilizzare fixture/token per AC-1..AC-4 | `packages/backend/src/index.ts`, `packages/backend/src/routes/users.ts` |

## Implementation order

1. Implementare `packages/backend/src/services/users-service.ts` con result union e gestione esplicita dei conflitti univoci (`username`) + validazione password minima.
2. Creare `packages/backend/src/routes/users.ts` seguendo pattern handler di `routes/auth.ts` (early return, `buildErrorResponse`, status espliciti).
3. Aggiornare `packages/backend/src/middleware/auth.ts` per restituire payload errore coerente (`error.code = "FORBIDDEN"`) in caso di ruolo non autorizzato.
4. Collegare `usersRouter` in `packages/backend/src/index.ts`.
5. Rifinire `packages/backend/src/__tests__/users-create.spec.ts` e verificare passaggio test story + regressione auth.

## Patterns to follow

- Da `docs/sprint-artifacts/story-1.3-RESEARCH.md`: handler route con chiamata service e mapping status (`packages/backend/src/routes/auth.ts:55`).
- Da `docs/sprint-artifacts/story-1.3-RESEARCH.md`: envelope error uniforme con `buildErrorResponse` (`packages/backend/src/routes/auth.ts:83`, `packages/backend/src/lib/errors.ts:11`).
- Da `docs/sprint-artifacts/story-1.3-RESEARCH.md`: RBAC riusabile via `authorize(...roles)` (`packages/backend/src/middleware/auth.ts:105`).
- Da `docs/sprint-artifacts/story-1.3-RESEARCH.md`: accesso DB con `PrismaClient` + select esplicito (`packages/backend/src/services/auth-service.ts:101`).

## Risks

- Regressione su endpoint auth se modifica `middleware/auth.ts` altera formato errore in test esistenti.
- Mapping errori Prisma incompleto puo' produrre `500` invece di `409 USERNAME_EXISTS`.
- Assenza di pattern consolidato zod in backend: rischio divergenza formato errori di validazione tra route.
