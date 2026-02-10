## Story Validation Log - 1.7

### Issue 1

- Problem: AC-1 usava `Given` con formulazione vaga ("valid JSON payload"), non conforme al requisito di dati specifici e poco testabile.
- Fix proposed: sostituire la formulazione generica con payload concreto (campi e valori specifici del modello `Cliente`).
- Fix applied: AC-1 ora include payload esplicito con `nome`, `cognome`, `ragione_sociale`, `tipologia`, `indirizzo`, `citta`, `cap`, `provincia`, `codice_cliente`.
- Verification: il `Given` è ora verificabile in test con request body deterministico.

### Issue 2

- Problem: AC-1 e AC-2 avevano `When` con due azioni concatenate (`POST/PUT` + `GET audit-log`), violando la regola "single clear action".
- Fix proposed: mantenere nel `When` solo l'azione primaria (create/update) e spostare la verifica audit nel `Then` come controllo conseguente.
- Fix applied: AC-1 `When` ora è solo `POST /api/clienti`; AC-2 `When` ora è solo `PUT /api/fornitori/5`. Le query audit sono nel `Then`.
- Verification: ogni AC ha un `When` singolo e lineare, testabile con assert separati su effetto secondario.

### Issue 3

- Problem: AC-3 e AC-4 avevano `Then` non completamente deterministici (paginazione non strutturata, errore 403 senza schema JSON preciso).
- Fix proposed: definire shape di risposta esplicita per paginazione e payload errore autorizzazione.
- Fix applied: AC-3 ora richiede `{ results, pagination { page, pageSize, total } }` e vincolo `results.length <= 10`; AC-4 richiede JSON errore `{ code: "FORBIDDEN", message: "Accesso negato" }`.
- Verification: i `Then` sono traducibili in assert puntuali su chiavi/valori e codici HTTP.

### Issue 4

- Problem: il task breakdown non includeva attività esplicite di test automatizzati per AC-1..AC-4.
- Fix proposed: aggiungere task dedicato ai test nella suite esistente.
- Fix applied: aggiunto Task 6 su `anagrafiche/tests.py` per create/update audit, filtro/paginazione, e 403 per `TECNICO`.
- Verification: ogni AC ha ora copertura implementativa + verifica test prevista nel piano.
