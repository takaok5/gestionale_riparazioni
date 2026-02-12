## Step 4 Validation - Story 5.5

### Issues Found

1. AC-4 aveva un `When` non testabile ("payload valido"), quindi mancavano dati concreti per costruire test deterministici.
2. AC-1 non definiva un criterio verificabile per `numeroOrdine` (mancava pattern atteso), rendendo ambiguo l'`expect()`.
3. AC-3 non richiedeva in modo esplicito l'assert su `error.message`, lasciando ambiguo il contratto `"ARTICOLO_NOT_FOUND in voce"`.

### Fixes Applied

1. AC-4 aggiornato con payload esplicito: `{ fornitoreId: 3, voci: [{ articoloId: 5, quantitaOrdinata: 1, prezzoUnitario: 100.00 }] }`.
2. AC-1 aggiornato con criterio testabile su `numeroOrdine` (`^ORD-[0-9]{6}$`) e check espliciti su `stato`/`totale`.
3. AC-3 aggiornato con assert esplicito su `response.body.error.message = "ARTICOLO_NOT_FOUND in voce"`.
4. Task ATDD aggiornato per includere assert su `error.message` e regex numero ordine.

### Result

- Issues found: 3
- Issues resolved: 3

