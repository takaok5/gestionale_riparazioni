---
story_id: '8.3'
created: '2026-02-13'
depends_on: []
files_modified:
  - packages/backend/src/services/auth-service.ts
  - packages/backend/src/routes/auth.ts
  - packages/backend/src/__tests__/portal-dashboard-me.atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 8.3

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/src/services/auth-service.ts` | Aggiungere funzione dominio portale per calcolare payload dashboard (`stats` + `eventiRecenti`) partendo da `clienteId` risolto dal token. | - |
| `packages/backend/src/routes/auth.ts` | Aggiungere endpoint `GET /api/portal/me` su `portalAuthRouter`, con verifica Bearer token portale e mapping errori coerente (`UNAUTHORIZED` / service unavailable). | `packages/backend/src/services/auth-service.ts` |
| `packages/backend/src/__tests__/portal-dashboard-me.atdd.spec.ts` | Rifinire setup dati e asserzioni solo se necessario per allineamento al contratto finale senza ridurre copertura AC-1..AC-4. | `packages/backend/src/routes/auth.ts` |

## Implementation order

1. Implementare in `packages/backend/src/services/auth-service.ts` una API `getPortalDashboard(accessToken)` che: valida token portale, risolve `clienteId`, costruisce `stats` con valori numerici non-null e produce `eventiRecenti` ordinati per timestamp desc.
2. Integrare `GET /api/portal/me` in `packages/backend/src/routes/auth.ts`, riusando pattern route->service->`buildErrorResponse` e restituendo contratto HTTP coerente con AC (200 su token valido, 401 su token mancante/non valido).
3. Eseguire `packages/backend/src/__tests__/portal-dashboard-me.atdd.spec.ts` e correggere solo mismatch implementativi, mantenendo 2+ test per AC e asserzioni specifiche.
4. Eseguire `npm test -- --run` a livello repository, verificare che la suite nuova passi e che non ci siano regressioni backend/shared.
5. Aggiornare artefatti pipeline (`test-output-8.3.txt`, `pipeline-state-8.3.yaml`, `STATE.md`) per il passaggio allo step review.

## Patterns to follow

- Da `docs/sprint-artifacts/story-8.3-RESEARCH.md`: pattern route -> service con `buildErrorResponse` e status mapping esplicito, come in `packages/backend/src/routes/dashboard.ts`.
- Da `docs/sprint-artifacts/story-8.3-RESEARCH.md`: error envelope portale coerente con `UNAUTHORIZED` e messaggio `"Token mancante o non valido"` come in `packages/backend/src/routes/auth.ts`.
- Da `docs/sprint-artifacts/story-8.3-RESEARCH.md`: ordinamento timeline desc per timestamp seguendo `packages/backend/src/services/notifiche-service.ts`.
- Mantenere stile test `vitest + supertest` con asserzioni osservabili (status, payload, assenza campi non attesi).

## Risks

- Aggregazione contatori da fonti multiple puo creare mismatch semantico su cosa sia "ordine aperto" vs "riparazione attiva" se le regole non sono centralizzate.
- Possibile bypass auth se il nuovo endpoint accetta token non-portal invece di vincolare il contratto portal.
- Timeline eventi da fonti diverse puo risultare duplicata o non stabile senza normalizzazione timestamp + ordinamento deterministico.
