# Review 4.7

## Scope
- Diff review su `packages/backend/src/services/fatture-service.ts`, `packages/backend/src/routes/fatture.ts`, `packages/backend/src/__tests__/fatture-lista-dettaglio-atdd.spec.ts`, `docs/stories/4.7.lista-e-dettaglio-fatture.story.md`.

### Issue 1
Status: RESOLVED

Problem:
- `asIsoDate` validava solo il formato regex (`YYYY-MM-DD`) ma accettava date di calendario invalide (es. `2026-02-31`), con rischio di filtri incoerenti.

Fix:
- Aggiunta validazione calendario tramite `Date.UTC` e confronto anno/mese/giorno normalizzati.

Evidence:
- `packages/backend/src/services/fatture-service.ts` funzione `asIsoDate`.

### Issue 2
Status: RESOLVED

Problem:
- Il filename PDF veniva ricostruito in `getFatturaPdfInTestStore` senza usare `pdfPath`, potendo divergere dalla convenzione salvata a creazione fattura.

Fix:
- Derivazione filename da `pdfPath` (`split('/').pop()`), con fallback solo difensivo.

Evidence:
- `packages/backend/src/services/fatture-service.ts` funzione `getFatturaPdfInTestStore`.

### Issue 3
Status: RESOLVED

Problem:
- L'endpoint PDF restituiva un payload testuale non compatibile con un file PDF realistico pur avendo `Content-Type: application/pdf`.

Fix:
- Generazione contenuto minimale con header `%PDF-1.4` e stream semplice, inviato come `Buffer`.

Evidence:
- `packages/backend/src/services/fatture-service.ts` funzione `getFatturaPdfInTestStore`.

## Post-Fix Checks
- `npm test -- src/__tests__/fatture-lista-dettaglio-atdd.spec.ts` (backend): PASS
- `npm run lint` (backend): PASS
