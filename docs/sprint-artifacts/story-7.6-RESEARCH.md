## Patterns Found

- `packages/backend/src/routes/fatture.ts:93` usa mapping esplicito `code -> HTTP status` (`VALIDATION_ERROR`, `FATTURA_NOT_FOUND`, `OVERPAYMENT_NOT_ALLOWED`) tramite helper dedicato: pattern da riusare per nuove route Stripe.
- `packages/backend/src/routes/fatture.ts:305` mostra pattern route protetta (`authenticate` + controllo ruolo `COMMERCIALE`) e payload construction verso service.
- `packages/backend/src/services/fatture-service.ts:641` implementa `createPagamentoInTestStore` con controllo overpayment e aggiornamento consistente di `totalePagato`, `residuo`, `stato`.
- `packages/backend/src/index.ts:24` monta `express.json()` globalmente prima delle route: per webhook Stripe serve route con `express.raw()` prima del parse JSON del body.

## Known Pitfalls

- Se il webhook Stripe usa `express.json()` al posto di raw body, la verifica firma fallisce sempre.
- Senza idempotenza su `sessionId`, webhook duplicati possono creare doppi pagamenti.
- `createPagamento` in ambiente non test ritorna `SERVICE_UNAVAILABLE` (`packages/backend/src/services/fatture-service.ts:809`): la story deve introdurre integrazione reale o adapter dedicato per produzione.

## Stack/Libraries to Use

- `express` router + middleware (`authenticate`) per endpoint REST.
- `zod` (via pattern esistenti service parser) per validare input endpoint e payload webhook.
- Stripe SDK ufficiale (`stripe`) per creazione checkout session e verifica firma webhook.
- `vitest` + `supertest` per ATDD su endpoint `/api/pagamenti/crea-link/:fatturaId` e `/api/webhooks/stripe`.

## Validation Issues Found And Resolved

1. Issue: AC-1 usava valori placeholder (`cs_test_...`) senza criterio di validazione dei campi dinamici.
   Fix: AC-1 ora richiede prefisso URL Stripe e regex esplicita del `sessionId`.
2. Issue: AC-3 non specificava formato di `event.created`, quindi `dataPagamento` non era verificabile in test.
   Fix: AC-3 ora fissa input numerico (`created=1739404800`) e output atteso `dataPagamento: "2025-02-13"`.
3. Issue: AC-5 non rendeva misurabile l'idempotenza.
   Fix: AC-5 ora richiede precondizione con `sessionId` concreto e post-condizione `pagamenti.length=1` invariato.
