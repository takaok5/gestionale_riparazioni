## Step 4 Validation Report - Story 3.6

### Issue 1 - Missing sad path AC

- Problem: la story includeva solo transizioni positive (AC-1..AC-7) senza un caso errore specifico per transizione non valida.
- Fix: aggiunta `AC 8 - Transizione non valida da PREVENTIVO_EMESSO` con input concreto, codice HTTP, errore atteso e verifica stato invariato.
- Verification: AC-8 presente nel file story con Given/When/Then completo e testabile.

### Issue 2 - Then incompleti su effetto storico

- Problem: i Then delle AC positive verificavano solo `data.stato` senza imporre controllo su `statiHistory`.
- Fix: aggiornati AC-1..AC-7 per includere verifica esplicita dell'ultima entry storico (`stato`, `userId`, `note`, timestamp ISO).
- Verification: ogni Then positivo contiene aspettative precise traducibili in `expect()` su payload + storico.

### Issue 3 - Dati input non abbastanza deterministici per test

- Problem: le richieste PATCH non includevano `note` specifiche, riducendo la testabilita' del controllo storico.
- Fix: aggiunte `note` concrete e univoche in AC-1..AC-7.
- Verification: ogni AC positiva ha payload completo con `stato` e `note` esplicite.
