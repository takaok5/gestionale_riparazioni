# Epic Details: Gestionale Riparazioni

Documento di dettaglio Epic/Story in formato compatibile con story-pipeline-v2.

---

# Epic 1: Autenticazione e Gestione Sessione

Implementa autenticazione utente e continuita' di sessione tramite JWT access/refresh token.

## Story 1.1: Login Utente

**As a** Tecnico, **I want** effettuare login con username e password, **so that** posso accedere al sistema con i miei permessi di ruolo.

### Acceptance Criteria

- **AC-1:** Given un utente attivo con username `mario.rossi` e password `Password1` esiste When invio `POST /api/auth/login` con quelle credenziali Then ricevo `200` con `accessToken` (JWT 15min), `refreshToken` (7d) e `user` `{ id, username, email, role }`.
- **AC-2:** Given non esiste un utente con username `utente.inesistente` e invio password `Password1` When invio `POST /api/auth/login` Then ricevo `401` con error code `INVALID_CREDENTIALS`.
- **AC-3:** Given esiste un utente con username `mario.disabilitato`, password `Password1` e `isActive=false` When invio `POST /api/auth/login` Then ricevo `401` con error code `ACCOUNT_DISABLED`.
- **AC-4:** Given sono stati registrati 5 tentativi falliti dallo stesso IP nei precedenti 60 secondi When effettuo il 6o tentativo di login Then ricevo `429` con header `retryAfter` intero nel range `1..60`.

### Complexity: M

### Dependencies: none

---

## Story 1.2: Rinnovo Sessione con Refresh Token

**As a** Tecnico, **I want** rinnovare la sessione usando un refresh token valido, **so that** posso continuare a usare l'app senza rifare il login ogni 15 minuti.

### Acceptance Criteria

- **AC-1:** Given ho ottenuto un `refreshToken` valido dal login di Story 1.1 When invio `POST /api/auth/refresh` con body `{ "refreshToken": "<token>" }` Then ricevo `200` con nuovo `accessToken` (JWT 15min), nuovo `refreshToken` (7d) e `user` `{ id, username, email, role }`.
- **AC-2:** Given il body non contiene `refreshToken` oppure il token non e' un JWT valido When invio `POST /api/auth/refresh` Then ricevo `401` con error code `INVALID_REFRESH_TOKEN` e nessun token in risposta.
- **AC-3:** Given il `refreshToken` e' scaduto oppure la firma e' invalida When invio `POST /api/auth/refresh` Then ricevo `401` con error code `INVALID_REFRESH_TOKEN` e nessun token in risposta.
- **AC-4:** Given il `refreshToken` appartiene a un utente che risulta `isActive=false` When invio `POST /api/auth/refresh` Then ricevo `401` con error code `ACCOUNT_DISABLED` e nessun token in risposta.

### Complexity: M

### Dependencies: 1.1

---

## Summary

| Epic | Stories | Complexity Distribution |
|------|---------|------------------------|
| Epic 1: Autenticazione e Gestione Sessione | 2 stories | 2M |
| **Total** | **2 stories** | **2M** |

---

_Generated from existing repo context (story 1.1 + implemented auth modules)_
