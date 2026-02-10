---
story_id: '1.2'
reviewed_at: '2026-02-10T10:30:32.8162900+01:00'
status: completed
---

# Review 1.2

### Issue 1: Access token accettato impropriamente su endpoint refresh
- Severity: High
- Status: RESOLVED
- Problema: i token emessi non distinguevano tipo access/refresh, quindi un access token poteva essere riusato su /api/auth/refresh.
- Fix applicato:
  - aggiunto claim tokenType in packages/backend/src/middleware/auth.ts
  - refreshSession richiede payload.tokenType = refresh in packages/backend/src/services/auth-service.ts
  - aggiunto test di regressione in packages/backend/src/__tests__/auth-refresh.spec.ts
- Verifica: passa il test su access token usato su refresh endpoint.

### Issue 2: JWT_SECRET_MISSING mascherato come servizio non disponibile
- Severity: Medium
- Status: RESOLVED
- Problema: i route handler auth mappavano qualunque errore del service su AUTH_SERVICE_UNAVAILABLE.
- Fix applicato:
  - introdotto respondAuthServiceError(...) in packages/backend/src/routes/auth.ts
  - mapping esplicito JWT_SECRET_MISSING a risposta 500 con codice coerente.
- Verifica: gestione errore centralizzata per /login e /refresh.

### Issue 3: Copertura test refresh non robusta sul tipo token
- Severity: Medium
- Status: RESOLVED
- Problema: helper test non imponeva tokenType refresh e mancava un caso negativo dedicato.
- Fix applicato:
  - aggiornato helper buildRefreshToken con tokenType default refresh
  - aggiunto test negativo per tokenType access su endpoint refresh.
- Verifica: suite backend verde con 19 test passati.

## Verifica task [x]

- Task 1 (routes/auth.ts): evidenza endpoint POST /refresh in packages/backend/src/routes/auth.ts.
- Task 2 (auth-service.ts): evidenza funzione refreshSession e validazioni token in packages/backend/src/services/auth-service.ts.
- Task 3 (auth-service.ts): evidenza check isActive prima emissione token in packages/backend/src/services/auth-service.ts.
- Task 4 (auth-refresh.spec.ts): evidenza 11 test in packages/backend/src/__tests__/auth-refresh.spec.ts.
- Task 5 (shared/types): evidenza tipo RefreshResponse in packages/shared/src/types/index.ts.
- Task 6 (errori 401 senza token): evidenza assert su assenza accessToken/refreshToken nei test AC-2, AC-3, AC-5.

## Gate checks

- npm test: PASS
- npm run lint: PASS
- False positives task marker: none
- Open issues: 0
