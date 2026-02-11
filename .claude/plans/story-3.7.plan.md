---
story_id: '3.7'
created: '2026-02-11'
depends_on: ['3.5', '3.6']
files_modified:
  - packages/backend/src/services/riparazioni-service.ts
  - packages/backend/src/routes/riparazioni.ts
  - packages/backend/src/__tests__/riparazioni-annullamento-admin-atdd.spec.ts
  - packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 3.7

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/src/services/riparazioni-service.ts` | Introdurre regola “ANNULLATA solo ADMIN”, consentire annullamento admin da ogni stato, mantenere parita' test-store/db e storico | Nessuna |
| `packages/backend/src/routes/riparazioni.ts` | Mappare il caso `FORBIDDEN` specifico su messaggio `Only admins can cancel repairs` senza rompere altri forbidden | Service |
| `packages/backend/src/__tests__/riparazioni-annullamento-admin-atdd.spec.ts` | Portare i test RED a GREEN per AC-1..AC-3 con assert su stato, payload e storico | Service + Route |
| `packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts` | Verificare/aggiornare aspettative se necessarie dopo nuova regola di annullamento admin | Service |

## Implementation order

1. Aggiornare `packages/backend/src/services/riparazioni-service.ts` con una validazione dedicata su target `ANNULLATA` che richiede `actorRole=ADMIN` e con bypass della matrice transizioni per annullamento admin.
2. Uniformare la logica tra `cambiaStatoRiparazioneInTestStore` e `cambiaStatoRiparazioneInDatabase` per evitare divergenze su storico/note/errori.
3. Aggiornare `packages/backend/src/routes/riparazioni.ts` per distinguere il forbidden di cancellazione (`Only admins can cancel repairs`) dagli altri forbidden (`Accesso negato`).
4. Eseguire e correggere `packages/backend/src/__tests__/riparazioni-annullamento-admin-atdd.spec.ts` fino a GREEN.
5. Eseguire regressione su `packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts` e intervenire solo se emergono regressioni legate alle nuove regole.

## Patterns to follow

- Da `docs/sprint-artifacts/story-3.7-RESEARCH.md`: usare il pattern di mapping errori centralizzato in `packages/backend/src/routes/riparazioni.ts:189`.
- Da `docs/sprint-artifacts/story-3.7-RESEARCH.md`: mantenere le regole di stato in funzioni/punti centrali (`BASE_ALLOWED_TRANSITIONS`, `validateBaseTransition`) in `packages/backend/src/services/riparazioni-service.ts:274`.
- Da `docs/sprint-artifacts/story-3.7-RESEARCH.md`: mantenere simmetria logica tra path in-memory e path DB (`packages/backend/src/services/riparazioni-service.ts:1555`, `packages/backend/src/services/riparazioni-service.ts:1605`).
- Nei test usare pattern ATDD esistente: patch + get di verifica storico (`packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts:100`).

## Risks

- Estendere annullamento admin “da ogni stato” puo' impattare i test di transizione esistenti se non isolato dal caso tecnico.
- Cambiare mapping errori route puo' alterare messaggi attesi in test legacy su `FORBIDDEN`.
- Divergenze tra test-store e path Prisma potrebbero produrre test intermittenti su `note`/`statiHistory`.
