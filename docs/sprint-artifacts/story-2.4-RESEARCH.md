# Story 2.4 Research

## Patterns Found

- packages/backend/src/routes/clienti.ts:33 usa helper dedicato per convertire errori service in HTTP status + uildErrorResponse.
- packages/backend/src/routes/clienti.ts:234 mostra pattern route POST con payload tipizzato, chiamata service e 201 su successo.
- packages/backend/src/routes/fornitori.ts:47 applica gia uthenticate + authorize("ADMIN") sui write endpoint fornitori.
- packages/backend/src/services/anagrafiche-service.ts:607 centralizza parse/validazione input con ield e ule testabili.
- packages/backend/src/services/anagrafiche-service.ts:434 implementa generazione codice progressivo (CLI-000001) riusabile per FOR-000001.
- packages/backend/src/services/anagrafiche-service.ts:1134 implementa create DB in transaction con audit e retry/gestione P2002.
- packages/backend/src/services/anagrafiche-service.ts:1237 mostra separazione test store vs database per mantenere test deterministici.

## Known Pitfalls

- In packages/backend/prisma/schema.prisma:69 Fornitore.partitaIva non e @unique: senza vincolo o controllo esplicito non e garantito 409 PARTITA_IVA_EXISTS.
- In packages/backend/src/services/anagrafiche-service.ts non esiste ancora createFornitore: va esteso sia path test che database per evitare mismatch tra ambienti.
- Il test store Fornitore usa shape minima (ragioneSociale/telefono): se non viene ampliato, i test AC-1/AC-2 non possono validare campi richiesti.
- La validazione partita IVA oggi in service e basata su regex (11 cifre), mentre in shared esiste anche validazione checksum (packages/shared/src/validators/index.ts:4): rischio incoerenza se non si decide una sola regola.

## Stack/Libraries to Use

- express + router module in packages/backend/src/routes/*.
- Prisma (@prisma/client) per persistenza e transazioni.
- itest + supertest per test ATDD API su endpoint REST.
- Helper uildErrorResponse in packages/backend/src/lib/errors.ts per envelope errori coerente.
- Middleware uthenticate/uthorize in packages/backend/src/middleware/auth.ts per RBAC.
