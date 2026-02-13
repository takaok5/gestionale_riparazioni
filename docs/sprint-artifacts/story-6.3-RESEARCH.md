## Patterns Found

- `packages/backend/src/routes/dashboard.ts:13` usa il pattern route->service con mapping esplicito degli errori (`VALIDATION_ERROR` -> 400, `FORBIDDEN` -> 403, fallback 500) tramite `buildErrorResponse`.
- `packages/backend/src/services/dashboard-service.ts:229` applica validazione preventiva di `actorUserId`/`actorRole` e blocco `Admin only` prima della logica di business.
- `packages/backend/src/services/dashboard-service.ts:323` aggrega riparazioni con `Map` su stati attivi (`IN_DIAGNOSI`, `IN_LAVORAZIONE`), pattern riusabile per conteggi carico tecnici.

## Known Pitfalls

- Usare scansione paginata completa (`fetchAllRiparazioni`) per dataset grandi puo causare latenza elevata.
- Se il join con utenti non filtra correttamente per ruolo `TECNICO`, l'endpoint puo includere utenti non ammessi.
- Se si salta il mapping uniforme errori route, i test ATDD su body errore (`error.code`, `error.message`) possono fallire.

## Stack/Libraries to Use

- `express` per route e middleware `authenticate`.
- `vitest` + `supertest` per test ATDD endpoint dashboard.
- Servizi backend esistenti (`dashboard-service`, `riparazioni-service`) per mantenere coerenza con pattern correnti.