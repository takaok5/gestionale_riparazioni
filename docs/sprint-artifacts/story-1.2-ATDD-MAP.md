# Story 1.2 ATDD Mapping

## AC list (from story file)

### AC-1
Given esiste un utente attivo `mario.rossi` con password `Password1` e ho ottenuto un `refreshToken` eseguendo `POST /api/auth/login` con quelle credenziali.
When invio `POST /api/auth/refresh` con body `{ "refreshToken": "<refreshToken_valido>" }`.
Then ricevo `200` con nuovi token e user `{ id:1, username:"mario.rossi", email:"mario.rossi@example.com", role:"TECNICO" }`.

Tests AC-1:
- `AC-1 - Rinnovo con refresh token valido -> returns 200 with new accessToken and refreshToken`
- `AC-1 - Rinnovo con refresh token valido -> returns user payload with id, username, email and role`

### AC-2
Given body `{}` senza `refreshToken`.
When la richiesta raggiunge endpoint refresh.
Then `401 INVALID_REFRESH_TOKEN` e nessun token in risposta.

Tests AC-2:
- `AC-2 - Refresh token mancante -> returns 401 INVALID_REFRESH_TOKEN when body is empty`
- `AC-2 - Refresh token mancante -> does not return accessToken and refreshToken when token is missing`

### AC-3
Given body `{ "refreshToken": "abc" }` non JWT.
When la richiesta viene validata.
Then `401 INVALID_REFRESH_TOKEN` e nessun token in risposta.

Tests AC-3:
- `AC-3 - Refresh token non JWT -> returns 401 INVALID_REFRESH_TOKEN for non-JWT token`
- `AC-3 - Refresh token non JWT -> never returns auth tokens for malformed refresh token`

### AC-4
Given refresh token scaduto o firmato con secret differente.
When il backend verifica il token.
Then `401 INVALID_REFRESH_TOKEN` e nessun token in risposta.

Tests AC-4:
- `AC-4 - Refresh token scaduto o firma invalida -> returns 401 INVALID_REFRESH_TOKEN for expired refresh token`
- `AC-4 - Refresh token scaduto o firma invalida -> returns 401 INVALID_REFRESH_TOKEN for token signed with wrong secret`

### AC-5
Given refresh token valido per utente `mario.disabilitato` (`isActive=false`).
When il backend verifica utente dal token.
Then `401 ACCOUNT_DISABLED` e nessun token in risposta.

Tests AC-5:
- `AC-5 - Account disabilitato su refresh -> returns 401 ACCOUNT_DISABLED when refresh token belongs to disabled user`
- `AC-5 - Account disabilitato su refresh -> does not expose accessToken or refreshToken for disabled user refresh`
