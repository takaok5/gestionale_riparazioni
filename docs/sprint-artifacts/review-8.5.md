# Review 8.5

## Scope

- Files reviewed:
  - packages/backend/src/services/auth-service.ts
  - packages/backend/src/routes/auth.ts
  - packages/backend/src/__tests__/portal-riparazioni-list-detail.atdd.spec.ts
  - docs/stories/8.5.lista-e-dettaglio-riparazioni-cliente.story.md

### Issue 1 - Accoppiamento fragile tra DTO ordini e DTO riparazioni
Status: RESOLVED

- Problem: listPortalRiparazioni era implementata come wrapper di listPortalOrdini, con remap da campi codiceOrdine/dataOrdine a codiceRiparazione/dataRicezione. Una variazione futura del DTO ordini avrebbe potuto rompere silenziosamente l'endpoint riparazioni.
- Fix: implementato flusso dedicato listPortalRiparazioni con mapping diretto da listRiparazioni e helper comune esolvePortalClienteIdFromAccessToken; listPortalOrdini ora dipende dal payload riparazioni (direzione più stabile).
- Verification: test portale ordini e riparazioni passano entrambi dopo il refactor.

### Issue 2 - Alias dettaglio non isolato per endpoint riparazioni
Status: RESOLVED

- Problem: getPortalRiparazioneDettaglio era un alias diretto a getPortalOrdineDettaglio, impedendo evoluzione indipendente del comportamento riparazioni e rendendo opaco il flusso di ownership validation.
- Fix: estratto core condiviso loadPortalRiparazioneDettaglio e instradato sia getPortalOrdineDettaglio sia getPortalRiparazioneDettaglio attraverso il core comune esplicito.
- Verification: GET /api/portal/riparazioni/:id mantiene 200 autorizzato e 403 cross-customer, con test verdi.

### Issue 3 - Copertura test incompleta sui path errore critici
Status: RESOLVED

- Problem: mancavano test specifici per due path critici del nuovo endpoint: richiesta senza Bearer token (401) e id non valido (400 VALIDATION_ERROR).
- Fix: aggiunti due test hardening in packages/backend/src/__tests__/portal-riparazioni-list-detail.atdd.spec.ts.
- Verification: suite del file aggiornata a 10 test con pass completo.

## Task Evidence

- Task 1 (GET /api/portal/riparazioni): evidenza in packages/backend/src/routes/auth.ts (route list riparazioni).
- Task 2 (listPortalRiparazioni): evidenza in packages/backend/src/services/auth-service.ts (funzione dedicata).
- Task 3 (GET /api/portal/riparazioni/:id): evidenza in packages/backend/src/routes/auth.ts (route dettaglio riparazioni).
- Task 4 (getPortalRiparazioneDettaglio + ownership): evidenza in packages/backend/src/services/auth-service.ts (getPortalRiparazioneDettaglio + core condiviso con check cliente).
- Task 5 (reuse mapping dettaglio): evidenza in packages/backend/src/services/auth-service.ts (payload dettaglio con timeline/documenti da getRiparazioneDettaglio).
- Task 6 (ATDD): evidenza in packages/backend/src/__tests__/portal-riparazioni-list-detail.atdd.spec.ts.

## Context Maintenance

- CLAUDE.md shards: nessuna nuova directory significativa introdotta dal codice story 8.5; nessuno shard aggiuntivo richiesto.
- Root CLAUDE.md: nessun nuovo comando/stack/convenzione introdotto; nessun update necessario.
- _bmad/bmm/config.yaml: path principali verificati e presenti (docs/prd.md, docs/architecture.md).