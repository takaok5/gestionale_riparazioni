## Patterns Found

- `packages/backend/src/routes/riparazioni.ts:235` e `packages/backend/src/routes/riparazioni.ts:236` mostrano il pattern route -> service per passare `page` e `limit` dalle query.
- `packages/backend/src/services/riparazioni-service.ts:1180` mostra la shape list response con `meta.page`, `meta.limit`, `meta.total`, `meta.totalPages`.
- `packages/backend/src/routes/fatture.ts:176` applica role guard `COMMERCIALE` prima della logica endpoint.
- `packages/backend/src/services/fatture-service.ts:340` usa clone difensivo del payload prima della risposta API.
- `packages/backend/src/services/fatture-pdf-service.ts:2` normalizza `numeroFattura` sostituendo `/` con `-` per il path PDF.
- `packages/backend/src/__tests__/fornitori-list-search-atdd.spec.ts:224` e `packages/backend/src/__tests__/riparazioni-list-filter-atdd.spec.ts:355` mostrano pattern di sad path su `limit` invalido con `VALIDATION_ERROR`.

## Known Pitfalls

- Incoerenza del contratto list se manca `meta.total` o cambia naming dei campi (`pageSize` vs `limit`).
- Error mapping non allineato tra service e route puo' degradare in `500` invece di `400/404` attesi.
- Endpoint PDF: restituire solo `pdfPath` invece di stream/headers corretti rompe l'AC su `Content-Type` e filename.

## Stack/Libraries to Use

- Express router in `packages/backend/src/routes/fatture.ts` per definire endpoint e status mapping.
- Service layer in `packages/backend/src/services/fatture-service.ts` per parsing/validazione query e risposta business.
- Utilita' PDF esistente `createFatturaPdfPath` in `packages/backend/src/services/fatture-pdf-service.ts`.
- Supertest + Vitest nei test ATDD backend (`packages/backend/src/__tests__/*.spec.ts`) per assert su HTTP status/body/header.
