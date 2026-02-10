---
story_id: '1.2'
created: '2026-02-10T10:21:38+01:00'
depends_on: ['1.1']
files_modified:
  - packages/backend/src/services/auth-service.ts
  - packages/backend/src/routes/auth.ts
  - packages/backend/src/middleware/auth.ts
  - packages/shared/src/types/index.ts
  - packages/backend/src/__tests__/auth-refresh.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 1.2

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/src/middleware/auth.ts` | esportare utility di verifica refresh token e mantenere `issueAuthTokens` come single source | - |
| `packages/backend/src/services/auth-service.ts` | aggiungere `refreshSession` con validazione token, lookup utente, check `isActive`, mapping errori | middleware/auth.ts |
| `packages/backend/src/routes/auth.ts` | aggiungere `POST /refresh` con parsing body, chiamata service e mapping `buildErrorResponse` | services/auth-service.ts |
| `packages/shared/src/types/index.ts` | introdurre tipo risposta refresh allineato a `LoginResponse` | routes/auth.ts |
| `packages/backend/src/__tests__/auth-refresh.spec.ts` | adattare test RED per passare in GREEN mantenendo copertura AC-1..AC-5 | routes/auth.ts |

## Implementation order

1. Estendere `packages/backend/src/middleware/auth.ts` con helper riusabile di verifica token refresh (`verifyRefreshToken`) senza rompere `authenticate` esistente.
2. Implementare `refreshSession` in `packages/backend/src/services/auth-service.ts` usando pattern result-union (`{ ok: true; data } | { ok: false; code }`) gia' usato da `loginWithCredentials`.
3. Aggiungere endpoint `POST /api/auth/refresh` in `packages/backend/src/routes/auth.ts` con error mapping esplicito (`INVALID_REFRESH_TOKEN`, `ACCOUNT_DISABLED`).
4. Aggiornare `packages/shared/src/types/index.ts` con tipo risposta refresh coerente al payload dell'endpoint.
5. Eseguire e adattare `packages/backend/src/__tests__/auth-refresh.spec.ts` fino a passaggio completo dei test mantenendo assert specifici sugli AC.

## Patterns to follow

- Da `docs/sprint-artifacts/story-1.2-RESEARCH.md`: route handler con early return e `buildErrorResponse` (`packages/backend/src/routes/auth.ts:33`).
- Da `docs/sprint-artifacts/story-1.2-RESEARCH.md`: result union in service (`packages/backend/src/services/auth-service.ts:107`).
- Da `docs/sprint-artifacts/story-1.2-RESEARCH.md`: emissione token centralizzata in `issueAuthTokens` (`packages/backend/src/middleware/auth.ts:77`).
- Da `docs/sprint-artifacts/story-1.2-RESEARCH.md`: formato errore uniforme (`packages/backend/src/lib/errors.ts:11`).

## Risks

- Regressione login se il refactor di `auth-service.ts` tocca il flusso esistente.
- Gestione incoerente di token invalidi/scaduti tra middleware e service.
- Test flaky se dipendono da clock/scadenza token senza margine.
