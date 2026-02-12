## Step 4 Validation - Story 5.3

### Issue 1: AC-2 non completamente testabile
- Problem: il Then di AC-2 indicava solo la giacenza finale, senza status HTTP e senza verifica registrazione movimento.
- Fix: aggiunti nel Then status `201` e registrazione movimento con `userId` + timestamp.
- Verification: AC-2 ora contiene output verificabili con `expect(response.status).toBe(201)` e assert su audit/movimento.

### Issue 2: AC-4 non completamente testabile
- Problem: il Then di AC-4 non specificava status di risposta ne metadati del movimento.
- Fix: aggiunti status `201` e requisito esplicito di registrazione movimento `RETTIFICA` con `userId` e timestamp.
- Verification: AC-4 ora e verificabile sia su side-effect (giacenza) sia su output API.

### Issue 3: AC-5 concorrenza troppo vaga
- Problem: AC-5 non definiva payload concorrenti, esito atteso per entrambe le richieste e giacenza finale.
- Fix: aggiunti payload concreti (`SCARICO` quantita `7`), status attesi (`201`/`400`) e giacenza finale attesa `3`.
- Verification: AC-5 ora e traducibile in test concorrente deterministico (`Promise.all`) con assert su outcome e stato finale.

### Issue 4: Task coverage incompleta per scenario concorrente
- Problem: il task testing era ambiguo ("estendere o suite dedicata") e non esplicitava test file e scenario parallelo.
- Fix: introdotto file target `packages/backend/src/__tests__/articoli-movimenti-atdd.spec.ts` e task separato per test concorrente.
- Verification: il breakdown ora mappa in modo esplicito AC-5 a task implementativo e test dedicato.
