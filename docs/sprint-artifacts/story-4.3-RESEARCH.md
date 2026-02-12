## Patterns Found

- packages/backend/src/routes/preventivi.ts:137 usa il pattern route -> payload tipizzato -> service -> mapper errori HTTP (respond*Failure).
- packages/backend/src/services/preventivi-service.ts:559 e packages/backend/src/services/preventivi-service.ts:593 mostrano la doppia implementazione coerente test-store/Prisma da replicare anche per inviaPreventivo.
- packages/backend/src/services/preventivi-service.ts:574 standardizza messaggi di business rule su stato preventivo (Cannot edit preventivo with stato ...) e va mantenuto per messaggi esatti AC.
- packages/backend/src/services/riparazioni-service.ts:278 definisce la transizione valida PREVENTIVO_EMESSO -> IN_ATTESA_APPROVAZIONE tramite validateBaseTransition.
- packages/backend/src/__tests__/preventivi-update-atdd.spec.ts:146 mostra pattern ATDD con setup stato esplicito (setPreventivoStatoForTests) e assert su messaggi errore esatti.

## Known Pitfalls

- packages/backend/prisma/schema.prisma:154 non contiene dataInvio su RiparazionePreventivo: senza migrazione il requisito AC-1 non e' persistibile.
- Nel backend non risultano librerie o adapter esistenti per email/PDF (packages/backend/package.json): introdurre side-effect esterni senza injection rende i test instabili.
- AC-1 combina update preventivo + update riparazione + email/PDF: senza boundary transazionale si rischiano stati parziali in caso di errore durante invio email.

## Stack/Libraries to Use

- Riutilizzare Express router pattern esistente e buildErrorResponse (packages/backend/src/lib/errors.ts).
- Riutilizzare Prisma transaction pattern gia' usato nei service backend.
- Riutilizzare Vitest + supertest + helper test-store esistenti per gli ATDD del nuovo endpoint.
