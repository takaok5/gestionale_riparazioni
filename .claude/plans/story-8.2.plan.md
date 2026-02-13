---
story_id: '8.2'
created: '2026-02-13'
depends_on: []
files_modified:
  - packages/backend/src/services/login-rate-limit.ts
  - packages/backend/src/services/auth-service.ts
  - packages/backend/src/routes/auth.ts
  - packages/backend/src/__tests__/portal-auth-login-refresh-logout.atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 8.2

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/src/services/login-rate-limit.ts` | Estendere rate limiter per chiave `ip+account` e policy `10 tentativi / 15 minuti`, restituendo lock compatibile con AC-3. | - |
| `packages/backend/src/services/auth-service.ts` | Aggiungere summary cliente in login portale, refresh/logout portale con rotazione e revoca refresh token in-memory. | `packages/backend/src/services/login-rate-limit.ts` |
| `packages/backend/src/routes/auth.ts` | Applicare lockout per login portale (`423 ACCOUNT_TEMPORARILY_LOCKED` + `Retry-After`) e aggiungere endpoint `POST /api/portal/auth/refresh` e `POST /api/portal/auth/logout`. | `packages/backend/src/services/auth-service.ts` |
| `packages/backend/src/__tests__/portal-auth-login-refresh-logout.atdd.spec.ts` | Allineare eventuali assertion al contratto finale senza ridurre la copertura AC. | `packages/backend/src/routes/auth.ts` |

## Implementation order

1. Estendere `packages/backend/src/services/login-rate-limit.ts` introducendo API keyed (`account+ip`) e soglie configurate per contesto portal.
2. Implementare in `packages/backend/src/services/auth-service.ts` il dominio portal refresh/logout: emissione nuovi token, invalidazione vecchi token, store revoche, e `profileSummary` su login.
3. Aggiornare `packages/backend/src/routes/auth.ts` per usare il nuovo rate limiter su `/api/portal/auth/login` e introdurre `/api/portal/auth/refresh` + `/api/portal/auth/logout`.
4. Eseguire `vitest` backend e correggere regressioni fino a green su tutta la suite, mantenendo rotta AC-1..AC-5 della story 8.2.
5. Verificare artefatti pipeline (`atdd-tests-8.2.txt`, output test) e riallineare task/story state prima di step review/commit.

## Patterns to follow

- Da `docs/sprint-artifacts/story-8.2-RESEARCH.md`: pattern route->service con `buildErrorResponse` e mapping centralizzato errori (`packages/backend/src/routes/auth.ts:137`).
- Da `docs/sprint-artifacts/story-8.2-RESEARCH.md`: verifica refresh token via `verifyAuthToken` e `tokenType` prima di issue nuovi token (`packages/backend/src/services/auth-service.ts:298`).
- Da `docs/sprint-artifacts/story-8.2-RESEARCH.md`: stile test `vitest + supertest` con asserzioni su status/payload e assenza token nei sad path (`packages/backend/src/__tests__/auth-refresh.spec.ts:24`).
- Mantenere envelope errori tramite `packages/backend/src/lib/errors.ts`.

## Risks

- Possibile regressione su `/api/auth/login` se la modifica del rate limiter non resta backward-compatible.
- Revoca refresh token in-memory valida per test singolo processo ma non distribuita multi-instance.
- Nuovi endpoint portal refresh/logout possono confliggere con convenzioni naming/error se non allineati a router auth esistente.
