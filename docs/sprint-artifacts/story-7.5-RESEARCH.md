## Patterns Found

- `packages/backend/src/routes/riparazioni.ts:357` espone endpoint PDF (`/:id/etichetta`) con `authenticate` + `authorize("TECNICO")`, quindi la nuova route ricevuta deve seguire lo stesso controllo accessi.
- `packages/backend/src/routes/riparazioni.ts:372` imposta `Content-Type: application/pdf` e `Content-Disposition` prima di inviare `Buffer`, pattern riusabile per `/:id/ricevuta`.
- `packages/backend/src/routes/riparazioni.ts:162` usa mapper errori dedicato (`VALIDATION_ERROR`, `NOT_FOUND`, fallback 500) con codice dominio `RIPARAZIONE_NOT_FOUND`.
- `packages/backend/src/services/riparazioni-service.ts:737` valida input endpoint con parser typed + `buildValidationFailure`, utile per nuovo entrypoint ricevuta.
- `packages/backend/src/services/riparazioni-service.ts:775` applica formato data `dd/MM/yyyy` via UTC (`formatDateForLabel`), pattern coerente con AC-3.
- `packages/backend/src/services/riparazioni-etichetta-pdf.ts:24` usa builder PDF deterministico in ambiente test con contenuto testuale verificabile (`%PDF` + campi), pattern adatto per test ricevuta senza parser PDF esterno.
- `packages/backend/src/__tests__/riparazioni-etichetta-atdd.spec.ts:110` mostra pattern ATDD Given/When/Then con assert su header PDF, payload `%PDF`, contenuti e sad path `404`.

## Known Pitfalls

- Non esiste ancora nessun endpoint `/api/riparazioni/:id/ricevuta`: aggiunta incompleta (route senza wiring service o viceversa) porta facilmente a 404/500.
- `accessoriConsegnati` e' una stringa libera: split con virgole e trim deve gestire voci vuote/spazi per non perdere o duplicare accessori.
- Formato data puo cambiare con timezone locale se non si usa logica UTC stabile.
- I test PDF rischiano flakiness se il builder non resta deterministico in `NODE_ENV=test`.
- Contratto 401 deve essere verificato senza indebolire i controlli auth globali gia usati da altre route.

## Stack/Libraries to Use

- Riutilizzare `pdfkit` gia presente nel backend (`packages/backend/package.json`) per renderizzare la ricevuta A4.
- Riutilizzare approccio di buffer PDF test deterministico introdotto in `packages/backend/src/services/riparazioni-etichetta-pdf.ts`.
- Nessuna nuova dipendenza necessaria per questa story: focus su wiring route/service/test.
