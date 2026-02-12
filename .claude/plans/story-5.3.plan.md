---
story_id: '5.3'
created: '2026-02-12'
depends_on: []
files_modified:
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/src/routes/articoli.ts
  - packages/backend/src/__tests__/articoli-movimenti-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 5.3

## Files to modify

| File | Change | Depends on |
| --------------- | ----------- | ---------- |
| packages/backend/prisma/schema.prisma | Aggiungere model MovimentoMagazzino e relazione con Articolo per tracciare tipo/quantita/riferimento/userId/timestamp. | - |
| packages/backend/src/services/anagrafiche-service.ts | Introdurre tipi input/output movimenti, parser validazione, implementazione test-store e database con transazione atomica e mapping errori. | packages/backend/prisma/schema.prisma |
| packages/backend/src/routes/articoli.ts | Aggiungere endpoint POST /api/articoli/:articoloId/movimenti, payload mapping, autorizzazione TECNICO|ADMIN, response/failure handler coerenti. | packages/backend/src/services/anagrafiche-service.ts |
| packages/backend/src/__tests__/articoli-movimenti-atdd.spec.ts | Stabilizzare asserzioni rispetto al contratto API finale e confermare copertura AC-1..AC-5 in GREEN. | packages/backend/src/routes/articoli.ts |

## Implementation order

1. Definire persistenza movimenti in packages/backend/prisma/schema.prisma (model + relation + indici) e preparare migrazione/dev sync.
2. Implementare logica core in packages/backend/src/services/anagrafiche-service.ts: parser movimento, regole CARICO/SCARICO/RETTIFICA, errore insufficient stock, transazione atomica e salvataggio movimento+audit.
3. Esporre il caso d'uso in packages/backend/src/routes/articoli.ts con nuovo handler e mappatura errori HTTP (201, 400, 404, 500) usando uildErrorResponse.
4. Eseguire e portare in GREEN packages/backend/src/__tests__/articoli-movimenti-atdd.spec.ts, poi re-run completo test backend e verificare regressioni su suite articoli esistenti.

## Patterns to follow

- Da docs/sprint-artifacts/story-5.3-RESEARCH.md: usare pattern route middleware + payload esplicito come in packages/backend/src/routes/articoli.ts:120.
- Da docs/sprint-artifacts/story-5.3-RESEARCH.md: seguire mapping failure centralizzato come in packages/backend/src/routes/articoli.ts:33.
- Da docs/sprint-artifacts/story-5.3-RESEARCH.md: parser campo-per-campo typed union sul modello parseCreateArticoloInput (packages/backend/src/services/anagrafiche-service.ts:1257).
- Da docs/sprint-artifacts/story-5.3-RESEARCH.md: atomicita con getPrismaClient().(...) come in packages/backend/src/services/anagrafiche-service.ts:2377.

## Risks

- Race condition su SCARICO concorrente senza lock/logica atomica.
- Divergenza contratto response tra route e test ATDD (movimento payload e campi timestamp/userId).
- Regressioni in query lista/alert articoli se la mutazione giacenza non mantiene invarianti.
