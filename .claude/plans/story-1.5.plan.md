---
story_id: '1.5'
created: '2026-02-10T15:48:12+01:00'
depends_on: ['1.4']
files_modified:
  - packages/backend/src/services/users-service.ts
  - packages/backend/src/routes/users.ts
  - packages/backend/src/__tests__/users-update-deactivate.spec.ts
  - packages/shared/src/types/index.ts
  - docs/stories/1.5.modifica-disattivazione-utente-admin.story.md
must_pass: [typecheck, lint, test]
---

# Plan Story 1.5

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/src/services/users-service.ts | introdurre use-case updateUserRole e deactivateUser con validazione input, lookup user, guard "last active admin", mapping errori dominio | @prisma/client, store test interno, packages/shared/src/types/index.ts |
| packages/backend/src/routes/users.ts | aggiungere endpoint PUT /:id e PATCH /:id/deactivate con uthenticate + uthorize("ADMIN"), mapping result -> HTTP status/body | packages/backend/src/services/users-service.ts, packages/backend/src/lib/errors.ts, packages/backend/src/middleware/auth.ts |
| packages/backend/src/__tests__/users-update-deactivate.spec.ts | portare i test RED a GREEN verificando AC-1..AC-4 con assert specifiche su status/body error | packages/backend/src/index.ts, packages/backend/src/routes/users.ts |
| packages/shared/src/types/index.ts | aggiungere/raffinare tipi per payload update-role e response utente aggiornato, se necessari al consumo frontend/backend | tipi utente condivisi esistenti |
| docs/stories/1.5.modifica-disattivazione-utente-admin.story.md | marcare task implementati e allineare tracking pipeline | output implementazione step 7 |

## Implementation order

1. Implementare in packages/backend/src/services/users-service.ts i nuovi metodi dominio (updateUserRole, deactivateUser) con supporto store test + Prisma, inclusa regola ultimo admin attivo.
2. Estendere packages/backend/src/routes/users.ts con PUT /api/users/:id e PATCH /api/users/:id/deactivate, mappando codici dominio (USER_NOT_FOUND, LAST_ADMIN_DEACTIVATION_FORBIDDEN, VALIDATION_ERROR) su status coerenti.
3. Aggiornare packages/shared/src/types/index.ts con i tipi minimi necessari a evitare duplicazione shape payload/response.
4. Rendere verdi packages/backend/src/__tests__/users-update-deactivate.spec.ts e assicurare regressione zero sui test esistenti auth/users.
5. Aggiornare checklist task nel file story e generare artefatti di verifica step 7.

## Patterns to follow

- Da docs/sprint-artifacts/story-1.5-RESEARCH.md: pattern route async + mapping errori in packages/backend/src/routes/users.ts:35.
- Da docs/sprint-artifacts/story-1.5-RESEARCH.md: envelope error centralizzato con uildErrorResponse (packages/backend/src/lib/errors.ts:11).
- Da docs/sprint-artifacts/story-1.5-RESEARCH.md: enforcement RBAC tramite uthorize(...roles) (packages/backend/src/middleware/auth.ts:106).
- Da docs/sprint-artifacts/story-1.5-RESEARCH.md: guard su account non attivo in service (packages/backend/src/services/auth-service.ts:182).
- Da docs/sprint-artifacts/story-1.5-RESEARCH.md: setup test deterministico con reset store (packages/backend/src/services/users-service.ts:274).

## Risks

- Regola "last active admin" puo' divergere tra store test e Prisma reale se la logica non e' centralizzata in service.
- Mapping errori incompleto nei nuovi endpoint users puo' generare 500 invece di 400/404/409 attesi dalle AC.
- Aggiornamenti ai tipi condivisi potrebbero impattare compilazione frontend se i nuovi type export rompono compatibilita'.
