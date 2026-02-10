# Story 1.1 ATDD Mapping (Step 5)

## Acceptance Criteria Read (Exact)

### AC-1
- Given a user with username "mario.rossi" and password "Password1" exists
- When I POST `/api/auth/login` with those credentials
- Then I receive `200` with `accessToken` (JWT 15min), `refreshToken` (7d), and `user` `{ id, username, email, role }`

### AC-2
- Given no user with username "utente.inesistente" exists and the login payload includes password "Password1"
- When I POST `/api/auth/login`
- Then I receive `401` with error code `INVALID_CREDENTIALS`

### AC-3
- Given a user with username "mario.disabilitato", password "Password1", and `isActive=false` exists
- When I POST `/api/auth/login` with that username and password
- Then I receive `401` with error code `ACCOUNT_DISABLED`

### AC-4
- Given 5 failed login attempts from same IP in 1 minute
- When I attempt a 6th login
- Then I receive `429` with `retryAfter` header containing an integer number of seconds in range `1..60`

## Test Mapping

- `AC-1` -> `auth-login.spec.ts` describe `AC-1 - Login Utente valido` (2 it blocks)
- `AC-2` -> `auth-login.spec.ts` describe `AC-2 - Username inesistente` (2 it blocks)
- `AC-3` -> `auth-login.spec.ts` describe `AC-3 - Account disabilitato` (2 it blocks)
- `AC-4` -> `auth-login.spec.ts` describe `AC-4 - Rate limit login` (2 it blocks)