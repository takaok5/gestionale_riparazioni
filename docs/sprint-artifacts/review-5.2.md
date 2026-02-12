# Review Story 5.2

### Issue 1: Prisma client typing incompatibility on `articolo` model
Status: RESOLVED

Problem:
- L'implementazione iniziale di `listArticoliInDatabase` usava `getPrismaClient().articolo` e `Prisma.ArticoloWhereInput`, ma il client tipizzato del repository non espone quel membro, causando errore `tsc`.

Fix:
- Allineato il pattern a `createArticoloInDatabase`: uso di `$transaction` con cast sicuro su `transaction.articolo` e fallback `SERVICE_UNAVAILABLE`.

Verification:
- `npm run typecheck` passa senza errori.

### Issue 2: False negative nel test di ricerca Samsung (case sensitivity)
Status: RESOLVED

Problem:
- Nel test AC-2 il controllo usava `includes("Samsung")` case-sensitive anche su campi con valore uppercase (`SAMSUNG-CODE-002`), producendo failure non legata alla logica API.

Fix:
- Aggiornato il test a confronto case-insensitive (`toLowerCase().includes("samsung")`).

Verification:
- `npm --workspace @gestionale/backend test -- src/__tests__/articoli-list-search-alert-atdd.spec.ts` passa con 13/13 test verdi.

### Issue 3: Copertura incompleta su auth/validazione endpoint lettura articoli
Status: RESOLVED

Problem:
- Mancavano controlli espliciti per ruolo ADMIN sui nuovi endpoint e per error path (401 senza token, invalid page query).

Fix:
- Aggiunti 3 test di hardening in `articoli-list-search-alert-atdd.spec.ts`:
  - accesso ADMIN consentito su `GET /api/articoli`
  - `401` su `GET /api/articoli/alert` senza Authorization
  - `400 VALIDATION_ERROR` su `page=abc`

Verification:
- Full suite verde con `npm test`.
