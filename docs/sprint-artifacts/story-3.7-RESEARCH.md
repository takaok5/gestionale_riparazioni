# Story 3.7 Research

## Patterns Found

- `packages/backend/src/routes/riparazioni.ts:189` usa una funzione dedicata di mapping errori (`respondCambiaStatoRiparazioneFailure`) per tradurre codici service in HTTP status/payload.
- `packages/backend/src/routes/riparazioni.ts:287` applica pattern route `PATCH /api/riparazioni/:id/stato` con payload tipizzato e delega al service.
- `packages/backend/src/services/riparazioni-service.ts:274` centralizza le transizioni consentite in `BASE_ALLOWED_TRANSITIONS` con validazione tramite `validateBaseTransition`.
- `packages/backend/src/services/riparazioni-service.ts:1555` e `packages/backend/src/services/riparazioni-service.ts:1605` mantengono parita' logica tra path test-store e path database.
- `packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts:100` segue pattern ATDD: `PATCH` per azione + `GET` di verifica stato/storico.
- `packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts:226` copre sad-path con assert su messaggio errore esatto.

## Known Pitfalls

- Il mapping `FORBIDDEN` in route oggi restituisce messaggio fisso `Accesso negato`; la story richiede messaggio specifico `Only admins can cancel repairs`.
- Le transizioni preventivo (story 3.6) verificano messaggi di invalid transition puntuali: espandere male le transizioni puo' rompere questi test.
- Senza una regola esplicita sul target `ANNULLATA`, un tecnico assegnato puo' passare i controlli autorizzativi attuali.
- Note/storico devono restare coerenti tra test-store e path Prisma, altrimenti i test ATDD su history divergono.

## Stack/Libraries to Use

- Express router per endpoint (`packages/backend/src/routes/riparazioni.ts`).
- Service layer TypeScript con union result typed (`packages/backend/src/services/riparazioni-service.ts`).
- Vitest + Supertest per ATDD API (`packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts`).
- JWT helper gia' presente nei test per simulare ruoli (`authHeader` nello stesso test file).

## Validation Issues Found and Fixed

1. **Issue:** AC-1 aveva testo corrotto (`note` spezzato) e Then non pienamente affidabile.
   **Fix:** riscritto Then con campo `note="Cliente ha ritirato dispositivo"` completo e verificabile.

2. **Issue:** AC-2 aveva testo corrotto (`note` spezzato) e vincolo ambiguo sul valore della nota.
   **Fix:** riscritto Then completo e reso esplicito `note=""` per testabilita' deterministica nel test-store.

3. **Issue:** AC-3 aveva Given corrotto su `tecnicoId=7`, riducendo precisione del setup.
   **Fix:** riscritto Given con dati completi e leggibili (`TECNICO userId=7`, `tecnicoId=7`, stato iniziale).

4. **Issue:** Nel file story precedente i backtick erano stati interpretati come escape e rimuovevano specificita' tecnica.
   **Fix:** rigenerato il file con quoting letterale per preservare endpoint, payload e campi.
