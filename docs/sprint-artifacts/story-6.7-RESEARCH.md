## Patterns Found

- `packages/backend/src/routes/report.ts:94` usa il pattern route report con `authenticate`, payload typed e mapping errori centralizzato.
- `packages/backend/src/routes/report.ts:44` mappa `FORBIDDEN` in risposta HTTP 403 con envelope `buildErrorResponse`.
- `packages/backend/src/services/report-service.ts:560` applica guardia Admin-only nel service layer (`actorRole !== "ADMIN"` + `message: "Admin only"`).
- `packages/backend/src/routes/fatture.ts:341` usa pattern download file con `Content-Type` + `Content-Disposition: attachment; filename=...`.
- `packages/backend/src/__tests__/report-riparazioni-atdd.spec.ts:116` mostra stile ATDD Given/When/Then con `supertest` e header `Authorization`.

## Known Pitfalls

- Generazione CSV senza escaping espone a CSV injection su valori che iniziano con `=`, `+`, `-`, `@`.
- CSV costruito integralmente in memoria puo' degradare performance su dataset grandi.
- Incoerenza tra filtri data usati nei report JSON e negli export CSV puo' produrre mismatch funzionali.
- Mancata definizione stabile dell'ordine colonne genera test flaky e regressioni sui consumer.

## Stack/Libraries to Use

- Express Router esistente in `packages/backend/src/routes/report.ts` per nuovi endpoint `/api/report/export/*`.
- Servizi dominio gia' presenti in `packages/backend/src/services/report-service.ts` (`listRiparazioni`, `listFatture`, `listArticoli`) come sorgente dati.
- `buildErrorResponse` per mantenere il contratto errori uniforme.
- Vitest + Supertest per test ATDD endpoint export in `packages/backend/src/__tests__/`.
