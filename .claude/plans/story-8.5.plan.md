---
story_id: '8.5'
created: '2026-02-13'
depends_on: []
files_modified:
  - packages/backend/src/routes/auth.ts
  - packages/backend/src/services/auth-service.ts
  - packages/backend/src/services/riparazioni-service.ts
  - packages/backend/src/index.ts
  - packages/backend/src/__tests__/portal-riparazioni-list-detail.atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 8.5

## Files to modify

| File | Change | Depends on |
| --------------- | ----------- | ---------- |
| packages/backend/src/services/auth-service.ts | Aggiungere use case listPortalRiparazioni e getPortalRiparazioneDettaglio con validazione token + ownership check + mapping output | packages/backend/src/services/riparazioni-service.ts |
| packages/backend/src/routes/auth.ts | Aggiungere route GET /api/portal/riparazioni e GET /api/portal/riparazioni/:id con mapping errori coerente (401/400/403/404/500) | packages/backend/src/services/auth-service.ts |
| packages/backend/src/services/riparazioni-service.ts | Esporre/riusare shape dettaglio utile per timeline/documenti collegati mantenendo retrocompatibilita' chiamanti esistenti | - |
| packages/backend/src/__tests__/portal-riparazioni-list-detail.atdd.spec.ts | Portare i test RED a GREEN allineando setup dati e assert ai contratti finali | route + service updates |
| packages/backend/src/index.ts | Verifica mount invariato del router portale (/api/portal) senza regressioni | packages/backend/src/routes/auth.ts |

## Implementation order

1. Implementare in packages/backend/src/services/auth-service.ts i metodi portale riparazioni (lista + dettaglio) riusando listRiparazioni/getRiparazioneDettaglio e controllo ownership clienteId.
2. Aggiungere in packages/backend/src/routes/auth.ts le due endpoint /riparazioni e /riparazioni/:id riusando il pattern Bearer+error-mapping gia' usato per /ordini.
3. Rifinire in packages/backend/src/services/riparazioni-service.ts il payload necessario (timeline/documenti) solo se i dati non sono gia' sufficienti per AC-3.
4. Adeguare packages/backend/src/__tests__/portal-riparazioni-list-detail.atdd.spec.ts al contratto effettivo e rieseguire test mirati per story 8.5.
5. Eseguire gate GREEN su test target + regression check backend prima dello step review.

## Patterns to follow

- Pattern route portale con guard Bearer e delega service: packages/backend/src/routes/auth.ts:511.
- Pattern mapping errori dettaglio con FORBIDDEN -> 403: packages/backend/src/routes/auth.ts:262.
- Pattern validazione token + clienteId per lista portale: packages/backend/src/services/auth-service.ts:824.
- Pattern ownership check dettaglio: packages/backend/src/services/auth-service.ts:913.
- Pattern ATDD portale list/detail: packages/backend/src/__tests__/portal-ordini-list-detail.atdd.spec.ts:105.

## Risks

- Possibile regressione su route portale esistenti se l'ordine dichiarazione middleware/route in uth.ts viene alterato.
- Possibile mismatch shape payload (meta, 	imeline, documentiCollegati) tra aspettative test e implementazione reale.
- Rischio leak cross-customer se ownership check non viene applicato in tutti i path errore/successo del dettaglio.