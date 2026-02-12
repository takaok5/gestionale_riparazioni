---
story_id: '5.4'
created: '2026-02-12T16:57:00.0986871+01:00'
depends_on: ['5.3']
files_modified:
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/services/riparazioni-service.ts
  - packages/backend/src/routes/riparazioni.ts
  - packages/backend/src/__tests__/riparazioni-detail-atdd.spec.ts
  - packages/backend/src/__tests__/riparazioni-ricambi-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 5.4

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/prisma/schema.prisma` | Aggiungere relazione esplicita `articoloId` su `RiparazioneRicambio` mantenendo snapshot (`codiceArticolo`, `descrizione`, `prezzoUnitario`) | - |
| `packages/backend/src/services/riparazioni-service.ts` | Implementare `POST /riparazioni/:id/ricambi`: parse input, validazioni, link ricambio, integrazione movimento stock, proiezione dettaglio arricchita | schema + pattern anagrafiche |
| `packages/backend/src/routes/riparazioni.ts` | Registrare endpoint `POST /:id/ricambi`, mapping failure `400/404` coerente con API esistenti | service riparazioni |
| `packages/backend/src/__tests__/riparazioni-ricambi-atdd.spec.ts` | Stabilizzare assert AC-1..AC-4 in GREEN in base al contratto finale | route + service |
| `packages/backend/src/__tests__/riparazioni-detail-atdd.spec.ts` | Adeguare/estendere assert `ricambi` per shape `{ articolo, quantita, prezzoUnitario }` senza regressioni | service dettaglio |

## Implementation order

1. Definire modello dati in `packages/backend/prisma/schema.prisma` per supportare `articoloId` su `RiparazioneRicambio` e mantenere compatibilita' snapshot.
2. Estendere parser, type result e logica DB/test-store in `packages/backend/src/services/riparazioni-service.ts` per il link ricambio con controllo esistenza articolo/riparazione e insufficient stock.
3. Integrare la creazione movimento `SCARICO` (o logica equivalente atomica) nel flusso di link ricambio dentro `packages/backend/src/services/riparazioni-service.ts`.
4. Esporre endpoint `POST /api/riparazioni/:id/ricambi` in `packages/backend/src/routes/riparazioni.ts` con middleware e mapping errori (`400`, `404`, `500`).
5. Aggiornare proiezione `GET /api/riparazioni/:id` in `packages/backend/src/services/riparazioni-service.ts` per restituire `ricambi[].articolo.{id,nome,codiceArticolo}`.
6. Portare i test RED in GREEN su `packages/backend/src/__tests__/riparazioni-ricambi-atdd.spec.ts` e riallineare `packages/backend/src/__tests__/riparazioni-detail-atdd.spec.ts`.
7. Eseguire `npm run test -w packages/backend -- --run` e verificare passaggio completo prima di Step 8.

## Patterns to follow

- Da `docs/sprint-artifacts/story-5.4-RESEARCH.md`: pattern route->payload->service->failure responder gia in `packages/backend/src/routes/riparazioni.ts:254`.
- Da `docs/sprint-artifacts/story-5.4-RESEARCH.md`: mapping Prisma `select`+projection in `packages/backend/src/services/riparazioni-service.ts:1326`.
- Da `docs/sprint-artifacts/story-5.4-RESEARCH.md`: semantica errori magazzino in `packages/backend/src/routes/articoli.ts:87` e atomicita' stock in `packages/backend/src/services/anagrafiche-service.ts:2749`.

## Risks

- Regressioni sul dettaglio riparazione se si rompe la shape storica di `ricambi`.
- Mancata atomicita' tra link ricambio e decremento stock in caso di errori concorrenti.
- Divergenza messaggi/codici errore rispetto agli AC ATDD (`ARTICOLO_NOT_FOUND`, insufficient stock specifico per ricambio).
