## Patterns Found

- `packages/backend/src/routes/notifiche.ts:7` usa il pattern route-level `authenticate` + `authorize("ADMIN")` e inoltro query verso service.
- `packages/backend/src/routes/fatture.ts:271`-`275` mostra il pattern per forwarding di filtri paginazione + date (`page`, `limit`, `dataDa`, `dataA`).
- `packages/backend/src/services/notifiche-service.ts:116` usa `parsePositiveInteger` + limiti (`DEFAULT_LIMIT`, `MAX_LIMIT`) per paginazione robusta.
- `packages/backend/src/services/fatture-service.ts:457`-`491` mostra validazione concreta di intervalli date (`dataDa`, `dataA`) e controllo `dataDa <= dataA`.
- `packages/backend/src/services/fatture-service.ts:700`-`716` mostra pattern filtro by range + calcolo `totalPages` coerente.
- `packages/backend/src/services/dashboard-service.ts:403` e `:557` usa messaggio `Admin only` per policy di accesso admin.

## Known Pitfalls

- Filtri date su stringhe ISO senza normalizzazione completa possono introdurre bug ai boundary (inizio/fine giorno).
- Cambiare il messaggio globale di `authorize` in `middleware/auth.ts` rischia regressioni su route che oggi aspettano `Accesso negato`.
- Paginazione senza ordinamento esplicito può rendere i test non deterministici quando il dataset cresce.

## Stack/Libraries to Use

- `Express` router e middleware già presenti (`authenticate`, `authorize`).
- Utility interne in service layer per parse/validation (pattern già usato in `fatture-service.ts`).
- `Vitest` + `supertest` per ATDD endpoint-level su `/api/notifiche`.
