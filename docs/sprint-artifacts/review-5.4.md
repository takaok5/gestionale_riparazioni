# Review Story 5.4

### Issue 1 - Dettaglio ricambi DB con articolo.id sempre 0
- Problem: in `packages/backend/src/services/riparazioni-service.ts` la proiezione DB di `ricambi` impostava `articolo.id` a `0`, perdendo il collegamento reale e rendendo incoerente il contratto rispetto ai test/AC.
- Fix: aggiunta lookup articoli per `codiceArticolo` e mapping dinamico `articolo.{id,nome,codiceArticolo}` in `getRiparazioneDettaglioInDatabase`.
- Verification: test mirati `riparazioni-detail-atdd` e `riparazioni-ricambi-atdd` passano.
- Status: RESOLVED

### Issue 2 - Messaggio stock insufficiente fragile su parsing stringa
- Problem: la normalizzazione errore stock dipendeva dal parsing del messaggio sorgente; in fallback perdeva dettaglio richiesto dagli AC.
- Fix: `normalizeInsufficientStockMessage` ora accetta anche `requested` e produce fallback deterministico `Insufficient stock for articolo: available 0, requested {n}`.
- Verification: test AC-2 in `packages/backend/src/__tests__/riparazioni-ricambi-atdd.spec.ts` passa con messaggio atteso.
- Status: RESOLVED

### Issue 3 - Mancanza CONTEXT.md in shard principali
- Problem: erano assenti `CONTEXT.md` in root e in alcuni package con `CLAUDE.md`, riducendo supporto ai workflow/agent legacy.
- Fix: creati `CONTEXT.md` con collegamento diretto a `CLAUDE.md` in root, `packages/frontend`, `packages/shared` e `.claude/plans` (backend gia presente).
- Verification: file presenti su disco e referenziabili.
- Status: RESOLVED
