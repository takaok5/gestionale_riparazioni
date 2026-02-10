---
story_id: '1.2'
verified: '2026-02-10T10:30:32.8162900+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Endpoint POST /api/auth/refresh rinnova la sessione con refresh token valido | VERIFIED | packages/backend/src/__tests__/auth-refresh.spec.ts AC-1 passa |
| 2 | Token mancante/non JWT/scaduto/firma invalida restituisce 401 INVALID_REFRESH_TOKEN | VERIFIED | Test AC-2, AC-3, AC-4 passano |
| 3 | Refresh token di account disabilitato restituisce 401 ACCOUNT_DISABLED senza token in risposta | VERIFIED | Test AC-5 passano |
| 4 | Access token non puo' essere usato su endpoint refresh | VERIFIED | Test dedicato tokenType access passa |
| 5 | Typecheck, lint, build e test globali sono verdi | VERIFIED | npm run typecheck, npm run lint, npm run build, npm test |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/routes/auth.ts | MODIFIED | 95 |
| packages/backend/src/services/auth-service.ts | MODIFIED | 198 |
| packages/backend/src/middleware/auth.ts | MODIFIED | 127 |
| packages/shared/src/types/index.ts | MODIFIED | 79 |
| packages/backend/src/__tests__/auth-refresh.spec.ts | CREATED | 139 |
| docs/stories/1.2.rinnovo-sessione-refresh-token.story.md | CREATED | 44 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| packages/backend/src/routes/auth.ts | packages/backend/src/services/auth-service.ts (refreshSession) | WIRED |
| packages/backend/src/services/auth-service.ts | packages/backend/src/middleware/auth.ts (verifyAuthToken, issueAuthTokens) | WIRED |
| packages/backend/src/__tests__/auth-refresh.spec.ts | POST /api/auth/refresh behavior | VERIFIED |
