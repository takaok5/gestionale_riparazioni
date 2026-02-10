---
story_id: '2.1'
created: '2026-02-10'
depends_on: []
files_modified:
  - packages/backend/src/routes/clienti.ts
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/src/lib/errors.ts
  - packages/backend/prisma/schema.prisma
  - packages/shared/src/validators/index.ts
  - packages/backend/src/__tests__/clienti-create-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 2.1

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/src/routes/clienti.ts | Allineare auth policy alla story, accettare payload esteso e mappare 400/409 con codici espliciti | packages/backend/src/services/anagrafiche-service.ts |
| packages/backend/src/services/anagrafiche-service.ts | Estendere input cliente, auto-generare codiceCliente, validare CF/P.IVA, gestire duplicato email | packages/shared/src/validators/index.ts, packages/backend/prisma/schema.prisma |
| packages/shared/src/validators/index.ts | Riutilizzare/estendere validatori fiscali e territoriali nel flusso create cliente | - |
| packages/backend/prisma/schema.prisma | Verificare/allineare vincoli unici necessari per email duplicata | packages/backend/src/services/anagrafiche-service.ts |
| packages/backend/src/lib/errors.ts | Confermare formato errore usato per EMAIL_ALREADY_EXISTS e validazioni campo | packages/backend/src/routes/clienti.ts |
| packages/backend/src/__tests__/clienti-create-atdd.spec.ts | Portare i test RED a GREEN senza ridurre specificita degli assert | Tutti i file sopra |

## Implementation order

1. Aggiornare service in packages/backend/src/services/anagrafiche-service.ts con parsing payload esteso, validazioni CF/P.IVA e generazione codiceCliente (CLI-000001 e incrementale).
2. Adeguare route packages/backend/src/routes/clienti.ts per autorizzazione da utente autenticato, mapping errori 409 (EMAIL_ALREADY_EXISTS) e inoltro campi completi al service.
3. Allineare vincoli/modello in packages/backend/prisma/schema.prisma e gestione errori in packages/backend/src/lib/errors.ts per conflitti email.
4. Integrare validatori shared in packages/shared/src/validators/index.ts (se necessario) e applicarli nel service per regole invalid_fiscal_code_format, invalid_cap, invalid_provincia.
5. Eseguire loop TDD su packages/backend/src/__tests__/clienti-create-atdd.spec.ts fino a green completo mantenendo gli assert specifici su status, codice errore e dettagli campo.
6. Rieseguire 
pm run typecheck --workspaces --if-present, 
pm run lint --workspaces --if-present, 
pm test -- --run e aggiornare task checklist nella story.

## Patterns to follow

- Pattern route + service + uildErrorResponse: packages/backend/src/routes/clienti.ts:15 e packages/backend/src/routes/clienti.ts:30.
- Pattern transazione create + audit log: packages/backend/src/services/anagrafiche-service.ts:611.
- Pattern mapping conflitto 409: packages/backend/src/routes/users.ts:30.
- Pattern parser/validation field-level: packages/backend/src/services/anagrafiche-service.ts:359.
- Riferimento obbligatorio: docs/sprint-artifacts/story-2.1-RESEARCH.md.

## Risks

- Cambio autorizzazione su /api/clienti puo introdurre regressioni di sicurezza se non allineato ai ruoli previsti.
- Auto-generazione codiceCliente deve essere consistente tra test-store e database reale.
- Vincolo univoco email puo richiedere migrazione dati o fallback applicativo in presenza di record legacy.
- Error mapping non allineato agli assert ATDD puo causare green parziale con regressioni contrattuali API.
