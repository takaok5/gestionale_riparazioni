# Review 8.1

### Issue 1 - Activation token expiry hardcoded
Status: RESOLVED
Problem: `activationTokenExpiresAt` was a fixed timestamp, creating time-dependent failures and expired tokens after a calendar date.
Fix: switched to relative expiry (`now + 24h`) during portal-account creation.
Evidence: `packages/backend/src/services/auth-service.ts:339`

### Issue 2 - Portal account flow disabled outside test mode
Status: RESOLVED
Problem: `createPortalAccountForCliente`, `activatePortalAccount`, and `loginPortalWithCredentials` returned service unavailable when `NODE_ENV !== test`, making production flow unreachable.
Fix: removed test-only early exits and kept the same logic available across environments.
Evidence: `packages/backend/src/services/auth-service.ts:325`

### Issue 3 - Missing explicit role guard on portal-account creation
Status: RESOLVED
Problem: `POST /api/clienti/:id/portal-account` was only authenticated, not role-restricted, allowing non-authorized roles to enable portal accounts.
Fix: added `authorize("ADMIN", "COMMERCIALE")` on the route.
Evidence: `packages/backend/src/routes/clienti.ts:291`

### Issue 4 - Portal notification could not simulate delivery failure path
Status: RESOLVED
Problem: portal activation notification always returned `INVIATA`, reducing testability for email-failure scenarios.
Fix: added `TEST_FAIL_PORTAL_EMAIL` handling and conditional notification status.
Evidence: `packages/backend/src/services/notifiche-service.ts:124`
