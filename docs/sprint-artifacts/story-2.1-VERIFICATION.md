---
story_id: '2.1'
verified: '2026-02-10T19:33:43.9094245+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Utente autenticato puo creare cliente senza ruolo ADMIN | VERIFIED | packages/backend/src/routes/clienti.ts + test AC-1 in packages/backend/src/__tests__/clienti-create-atdd.spec.ts |
| 2 | codiceCliente viene auto-generato con formato CLI-000001 | VERIFIED | packages/backend/src/services/anagrafiche-service.ts + test AC-1 |
| 3 | Duplicato email restituisce 409 EMAIL_ALREADY_EXISTS | VERIFIED | packages/backend/src/routes/clienti.ts + test AC-4 |
| 4 | CF/P.IVA/CAP/provincia invalidi sono validati con errore coerente | VERIFIED | packages/backend/src/services/anagrafiche-service.ts + test AC-2/AC-3/AC-5 |
| 5 | Suite regressione backend resta verde | VERIFIED | 
pm run test -w packages/backend (63 test pass) |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/routes/clienti.ts | UPDATED | 63 |
| packages/backend/src/services/anagrafiche-service.ts | UPDATED | 1151 |
| packages/backend/prisma/schema.prisma | UPDATED | 89 |
| packages/backend/src/__tests__/clienti-create-atdd.spec.ts | CREATED | 265 |
| docs/stories/2.1.creazione-cliente.story.md | CREATED/UPDATED | 69 |
| docs/sprint-artifacts/review-2.1.md | CREATED | 25 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| packages/backend/src/routes/clienti.ts | packages/backend/src/services/anagrafiche-service.ts | WIRED |
| packages/backend/src/services/anagrafiche-service.ts | packages/backend/prisma/schema.prisma | WIRED |
| packages/backend/src/__tests__/clienti-create-atdd.spec.ts | packages/backend/src/routes/clienti.ts | VERIFIED |
