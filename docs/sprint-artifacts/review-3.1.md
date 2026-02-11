# Review Story 3.1

## Scope

Review su implementazione story 3.1 (schema, service, route, test ATDD, wiring app, artefatti pipeline).

## Task Evidence

- Task 1 (`schema Riparazione`): evidenza in `packages/backend/prisma/schema.prisma` (campi nuovi + `@@index([dataRicezione])`).
- Task 2 (`riparazioni-service`): evidenza in `packages/backend/src/services/riparazioni-service.ts`.
- Task 3 (`route POST /api/riparazioni`): evidenza in `packages/backend/src/routes/riparazioni.ts`.
- Task 4 (`wiring index`): evidenza in `packages/backend/src/index.ts` (`app.use("/api/riparazioni", riparazioniRouter)`).
- Task 5 (`tipi condivisi`): evidenza in `packages/shared/src/types/index.ts` (`CreateRiparazioneRequest/Response`).
- Task 6 (`ATDD`): evidenza in `packages/backend/src/__tests__/riparazioni-create-atdd.spec.ts`.

### Issue 1 - Flakiness su progressivo giornaliero nei test AC-2
Status: RESOLVED

Problema:
- I test AC-2 dipendevano dalla data di runtime; senza clock controllato, il prefisso `RIP-YYYYMMDD` poteva divergere dal valore atteso.

Fix applicato:
- In `packages/backend/src/__tests__/riparazioni-create-atdd.spec.ts` aggiunti `vi.useFakeTimers()` e `vi.setSystemTime("2026-02-09T10:00:00.000Z")` in `beforeEach`, con `vi.useRealTimers()` in `afterEach`.

Verifica:
- `npm run test -w packages/backend -- --run src/__tests__/riparazioni-create-atdd.spec.ts` passa con codici `RIP-20260209-0001` e `RIP-20260209-0006`.

### Issue 2 - Incompatibilita tipi `priorita` nel service DB path
Status: RESOLVED

Problema:
- `tsc --noEmit` falliva su `packages/backend/src/services/riparazioni-service.ts` per mismatch `string` -> union `Priorita` nel payload di ritorno (`CreateRiparazioneResult`).

Fix applicato:
- Inserita funzione `coercePriorita()` e normalizzazione nel mapping di output del ramo DB.

Verifica:
- `npm run typecheck` passa su tutti i workspace.

### Issue 3 - Lista test ATDD incompatibile con esecuzione workspace root
Status: RESOLVED

Problema:
- `docs/sprint-artifacts/atdd-tests-3.1.txt` conteneva path root-level (`packages/backend/...`) che causava filter mismatch in `vitest run` lato workspace backend durante il gate GREEN.

Fix applicato:
- Aggiornato file ATDD a `src/__tests__/riparazioni-create-atdd.spec.ts`.

Verifica:
- Esecuzione root `npm test -- --run src/__tests__/riparazioni-create-atdd.spec.ts` passa e valida il test ATDD nel workspace backend.

## Final Checks

- `npm run lint` -> PASS
- `npm run typecheck` -> PASS
- `npm run build` -> PASS
- `npm test -- --run src/__tests__/riparazioni-create-atdd.spec.ts` -> PASS
- `npm test -- --run` -> PASS

## False Positives

- Nessuna task `[x]` senza evidenza codice.
