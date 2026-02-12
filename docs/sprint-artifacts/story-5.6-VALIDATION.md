## Step 4 Validation - Story 5.6

### Issues Found

1. AC-7 era ambiguo sul modello autorizzativo: ruolo `TECNICO` con expected `400` puo' confliggere con un eventuale guard route-level `ADMIN` (che darebbe `403` prima della regola dominio).
2. AC-1 non fissava il valore iniziale di `dataEmissione`, quindi il test non distingueva tra campo preesistente e campo impostato dalla transizione.
3. AC-4 non fissava il valore iniziale di `dataRicezione` e AC-7 non richiedeva esplicitamente verifica di stato invariato dopo errore.

### Fixes Applied

1. AC-7 aggiornato con attore `COMMERCIALE` (non admin), errore esatto richiesto e vincolo esplicito su stato invariato.
2. AC-1 aggiornato con precondizione `dataEmissione = null`.
3. AC-4 aggiornato con precondizione `dataRicezione = null` e task aggiuntivo `Failure invariants` per verificare stato invariato nei path di errore.
4. Notes implementative aggiornate: endpoint `PATCH /api/ordini/:id/stato` con `authenticate` (no `authorize("ADMIN")`) per consentire il controllo dominio AC-7.

### Result

- Issues found: 3
- Issues resolved: 3
