# Review 8.2

### Issue 1
Status: RESOLVED
Problem: `POST /api/portal/auth/logout` accettava qualsiasi header `Authorization` con prefisso `Bearer` senza validare firma/tokenType.
Fix: aggiunta validazione tramite `verifyAuthToken` e controllo `tokenType === "access"` prima della revoca.
Evidence:
- `packages/backend/src/routes/auth.ts:292`
- `packages/backend/src/routes/auth.ts:285`
- `packages/backend/src/__tests__/portal-auth-login-refresh-logout.atdd.spec.ts:263`

### Issue 2
Status: RESOLVED
Problem: refresh/logout portale potevano accettare refresh token non del dominio portale se il formato JWT era valido.
Fix: `resolvePortalClienteId` ora richiede `payload.role === "COMMERCIALE"` oltre al prefisso `userId` portale.
Evidence:
- `packages/backend/src/services/auth-service.ts:466`
- `packages/backend/src/services/auth-service.ts:467`
- `packages/backend/src/__tests__/portal-auth-login-refresh-logout.atdd.spec.ts:205`

### Issue 3
Status: RESOLVED
Problem: blacklist dei refresh token revocati senza cleanup, rischio crescita memoria nel lungo periodo.
Fix: sostituzione `Set` con `Map<token, expiresAt>` e cleanup periodico su lettura/scrittura.
Evidence:
- `packages/backend/src/services/auth-service.ts:142`
- `packages/backend/src/services/auth-service.ts:479`
- `packages/backend/src/services/auth-service.ts:501`
