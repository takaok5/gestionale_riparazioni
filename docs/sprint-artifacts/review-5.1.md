# Review Story 5.1

### Issue 1
- Status: RESOLVED
- Problem: `codiceArticolo` veniva confrontato in modo case-sensitive; `LCD-SAMS21` e `lcd-sams21` potevano coesistere.
- Fix: normalizzazione in uppercase nel parser e verifica con test ATDD dedicato.
- Evidence:
  - `packages/backend/src/services/anagrafiche-service.ts`
  - `packages/backend/src/__tests__/articoli-create-atdd.spec.ts`

### Issue 2
- Status: RESOLVED
- Problem: `categoria` veniva persa nel casing originale creando possibili incoerenze tra payload e persistenza.
- Fix: normalizzazione in uppercase nel parser `parseCreateArticoloInput`.
- Evidence:
  - `packages/backend/src/services/anagrafiche-service.ts`

### Issue 3
- Status: RESOLVED
- Problem: `sogliaMinima` era validata come strettamente positiva, impedendo il caso legittimo `0` (soglia disabilitata).
- Fix: introdotta validazione `asNonNegativeInteger` e applicata a `sogliaMinima`.
- Evidence:
  - `packages/backend/src/services/anagrafiche-service.ts`

## Task Evidence Check
- Tutte le task `[x]` in `docs/stories/5.1.creazione-articolo-magazzino.story.md` hanno evidenza diretta nei file modificati:
  - schema: `packages/backend/prisma/schema.prisma`
  - service: `packages/backend/src/services/anagrafiche-service.ts`
  - route: `packages/backend/src/routes/articoli.ts`
  - wiring: `packages/backend/src/index.ts`
  - test: `packages/backend/src/__tests__/articoli-create-atdd.spec.ts`

## Result
- Issues found: 3
- Issues resolved: 3
- False positives on task markers: 0
