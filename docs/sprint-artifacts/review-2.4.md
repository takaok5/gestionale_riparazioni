---
story_id: '2.4'
reviewed_at: '2026-02-10T23:12:05+01:00'
reviewer: 'codex'
---

# Review 2.4

### Issue 1 - ATDD list path non compatibile con test runner workspace
- Severity: medium
- Status: RESOLVED
- Problem: docs/sprint-artifacts/atdd-tests-2.4.txt conteneva path root-level (packages/backend/...) che con 
pm test --workspaces veniva passato a Vitest backend come filtro non valido, causando falso fail del gate GREEN.
- Fix: normalizzato il path ATDD a src/__tests__/fornitori-create-atdd.spec.ts nel file docs/sprint-artifacts/atdd-tests-2.4.txt.
- Verification: gate GREEN step 7 rieseguito con pass su check ATDD tests pass (RED?GREEN verified).

### Issue 2 - Rischio duplicati partita IVA in assenza vincolo applicato a runtime
- Severity: high
- Status: RESOLVED
- Problem: createFornitoreInDatabase gestiva il duplicato solo via errore P2002; senza vincolo DB applicato (schema aggiornato ma migrazione non ancora eseguita) la duplicate detection poteva non attivarsi.
- Fix: aggiunto pre-check esplicito su ornitore.findFirst({ where: { partitaIva } }) in packages/backend/src/services/anagrafiche-service.ts prima della transaction, con ritorno PARTITA_IVA_EXISTS.
- Verification: test AC-4 in packages/backend/src/__tests__/fornitori-create-atdd.spec.ts passa (409 PARTITA_IVA_EXISTS).

### Issue 3 - Task 9 privo di evidenza test lato shared
- Severity: medium
- Status: RESOLVED
- Problem: la convergenza regola partitaIva tra backend/shared era implementata ma non coperta da test nel package shared.
- Fix: aggiunto packages/shared/src/validators/index.spec.ts con test su isValidPartitaIva (11 cifre valide, lunghezza invalida) e regression check su altri validator.
- Verification: suite shared passa (packages/shared/src/validators/index.spec.ts 4 test pass).
