---
story_id: '3.6'
created: '2026-02-11T20:49:00+01:00'
depends_on: ['3.5']
files_modified:
  - packages/backend/src/services/riparazioni-service.ts
  - packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts
  - docs/stories/3.6.cambio-stato-riparazione-transizioni-preventivo.story.md
must_pass: [test]
---

# Plan Story 3.6

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/src/services/riparazioni-service.ts` | Estendere `BASE_ALLOWED_TRANSITIONS` con transizioni preventivo e mantenere validazione centralizzata | Story 3.5 transition engine |
| `packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts` | Portare i test RED a GREEN dopo aggiornamento transizioni | `riparazioni-service.ts` |
| `docs/stories/3.6.cambio-stato-riparazione-transizioni-preventivo.story.md` | Aggiornare checklist task della story durante implementazione | Step 7 progress |

## Implementation order

1. Aggiornare matrice transizioni in `packages/backend/src/services/riparazioni-service.ts` aggiungendo i percorsi AC-1..AC-7 e lasciando invariata la guard `validateBaseTransition`.
2. Verificare che la logica di cambio stato resti coerente nei due percorsi (`cambiaStatoRiparazioneInTestStore` e `cambiaStatoRiparazioneInDatabase`) senza bypass del controllo transizione.
3. Eseguire `npm test -- --run` e confermare passaggio a GREEN per `packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts` mantenendo verdi le suite regressione.
4. Aggiornare i task della story `docs/stories/3.6.cambio-stato-riparazione-transizioni-preventivo.story.md` marcando completamento effettivo.

## Patterns to follow

- Da `docs/sprint-artifacts/story-3.6-RESEARCH.md`: usare `BASE_ALLOWED_TRANSITIONS` in `packages/backend/src/services/riparazioni-service.ts:274` come singola fonte delle transizioni.
- Da `docs/sprint-artifacts/story-3.6-RESEARCH.md`: mantenere `validateBaseTransition` in `packages/backend/src/services/riparazioni-service.ts:791` prima di ogni mutazione.
- Da `docs/sprint-artifacts/story-3.6-RESEARCH.md`: preservare pattern route/service gia' esistente in `packages/backend/src/routes/riparazioni.ts:287` senza cambiare contratto API.
- Da `docs/sprint-artifacts/story-3.6-RESEARCH.md`: seguire stile ATDD con assert su storico come in `packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts:114`.

## Risks

- Una transizione aggiunta in modo errato puo' aprire salti non consentiti o bloccare flussi base gia' coperti dalla story 3.5.
- Divergenza tra percorso in-memory e percorso Prisma se la validazione viene applicata in modo non uniforme.
- Regressioni su test stato esistenti se cambia il messaggio di errore per transizioni invalide.
