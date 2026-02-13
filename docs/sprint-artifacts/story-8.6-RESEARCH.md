# Story 8.6 Research

## Patterns Found

- `packages/backend/src/routes/auth.ts:604` usa guard Bearer token + service call + centralized failure mapper, pattern riusabile per `POST /api/portal/preventivi/:id/risposta`.
- `packages/backend/src/routes/auth.ts:326` mostra mappatura coerente per `UNAUTHORIZED`/`VALIDATION_ERROR`/`FORBIDDEN`/`NOT_FOUND` nei flussi portal.
- `packages/backend/src/services/auth-service.ts:947` applica ownership check (`dettaglio.cliente.id !== clienteId -> FORBIDDEN`) prima di restituire dati sensibili.
- `packages/backend/src/services/preventivi-service.ts:1290` e `:1335` gestiscono transizione risposta preventivo con regole: solo `INVIATO` puo' transitare e aggiornamento sincronizzato di `riparazioneStato`.
- `packages/backend/src/__tests__/portal-riparazioni-list-detail.atdd.spec.ts:227` fornisce pattern ATDD portal per caso `403 FORBIDDEN` cross-customer.
- `packages/backend/src/__tests__/preventivi-response-atdd.spec.ts:37` fornisce pattern ATDD di approvazione/rifiuto e blocco duplicate response.

## Known Pitfalls

- Il dominio preventivi oggi ritorna `VALIDATION_ERROR` + messaggio per duplicate response; AC-3 richiede codice esplicito `RESPONSE_ALREADY_RECORDED`.
- Se il flusso portal aggiorna il preventivo senza ownership check sulla riparazione collegata, si espone un bug di escalation cross-customer.
- La route portal deve mantenere allineamento con i mapper errori esistenti (`401/400/403/404/500`) per evitare regressioni contrattuali API.

## Stack/Libraries to Use

- `express` router pattern gia' presente in `packages/backend/src/routes/auth.ts`.
- Service composition in `packages/backend/src/services/auth-service.ts` per validazione token + ownership + delega domain.
- Domain logic in `packages/backend/src/services/preventivi-service.ts` per transizioni stato.
- `vitest` + `supertest` per ATDD endpoint portal in `packages/backend/src/__tests__/*.spec.ts`.