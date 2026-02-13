## Patterns Found

- `packages/backend/src/routes/auth.ts:422` usa il pattern portal route con Bearer token check, delega al service e mapping errore centralizzato.
- `packages/backend/src/routes/riparazioni.ts:379` costruisce payload query (`page`, `limit`, `stato`) direttamente da `req.query` e restituisce risposta `200` con `data + meta`.
- `packages/backend/src/services/riparazioni-service.ts:604` valida filtri/paginazione con parser dedicato (`invalid_integer`, `invalid_enum`, limiti massimi).
- `packages/backend/src/services/riparazioni-service.ts:1422` espone meta pagination standardizzata: `page`, `limit`, `total`, `totalPages`.
- `packages/backend/src/services/riparazioni-service.ts:1564` mostra dettaglio completo con timeline (`statiHistory`) e dati economici (`preventivi`, `ricambi`) riusabili per il payload ordine portale.

## Known Pitfalls

- Evitare filtro cliente applicato dopo slicing pagina: produce `meta.total` incoerente rispetto ai risultati reali.
- Evitare uso diretto di `getRiparazioneDettaglio` senza ownership check: puo' esporre dati di altri clienti e violare AC-4.
- Evitare risposte portale con shape incoerente tra endpoint (`data/meta` vs campi flat): rende i test ATDD instabili.

## Stack/Libraries to Use

- Express router + `buildErrorResponse` per envelope errori API.
- Service layer TypeScript esistente in `packages/backend/src/services/*` (stesso stile di parse/validate/result union).
- Vitest + Supertest (`packages/backend/src/__tests__`) per ATDD endpoint portale.
