## Patterns Found

- `packages/backend/src/routes/clienti.ts:33` usa helper `respond*Failure` per mappare codici dominio -> HTTP status con `buildErrorResponse`.
- `packages/backend/src/services/anagrafiche-service.ts:1347` mostra parser input con `ValidationFailure` strutturata (field/rule/message) riusabile per endpoint portal-account.
- `packages/backend/src/services/anagrafiche-service.ts:2748` usa `prisma.$transaction` + `select` esplicito + fallback `SERVICE_UNAVAILABLE`.
- `packages/backend/src/middleware/auth.ts:152` emette JWT con `tokenType` (`access`/`refresh`) e scadenze coerenti.
- `packages/backend/src/services/auth-service.ts:209` usa `bcrypt.compare` per login; il flusso attivazione password deve seguire lo stesso pattern.
- `packages/backend/src/services/notifiche-service.ts:178` crea notifiche testabili (`testNotifiche`) con payload esplicito.

## Known Pitfalls

- Doppio percorso dati (store test vs Prisma) in `anagrafiche-service` puo creare divergenze se la logica portal-account viene aggiornata solo in uno dei due rami.
- Mancanza di `JWT_SECRET` (`packages/backend/src/middleware/auth.ts:147`) blocca la verifica token in runtime.
- Side effect email/notifica puo fallire: i test devono verificare il comportamento atteso in caso `INVIATA`/`FALLITA` senza rompere la semantica HTTP richiesta.

## Stack/Libraries to Use

- `jsonwebtoken` via helper esistenti in `packages/backend/src/middleware/auth.ts`.
- `bcryptjs` via pattern in `packages/backend/src/services/auth-service.ts`.
- Prisma ORM con transazioni e `select` espliciti (`packages/backend/src/services/anagrafiche-service.ts`).
- Envelope error standard con `buildErrorResponse` (`packages/backend/src/lib/errors.ts`).
