## Story Validation - 3.5

### Issue 1 - AC-1 non completamente verificabile sul payload di risposta
- Problem: l'AC indicava `200` e cambio stato, ma non fissava i campi minimi del body HTTP.
- Fix applied: aggiunto vincolo esplicito su risposta `{ data: { id: 10, stato: "IN_DIAGNOSI" } }`.
- Verification: AC-1 ora e' traducibile in assert diretti su status + body payload.

### Issue 2 - AC-5 mancava il vincolo di non regressione sullo stato
- Problem: l'AC copriva solo l'errore `400` senza richiedere esplicitamente che stato/storico restino invariati.
- Fix applied: aggiunti requisiti "stato resta RICEVUTA" e "nessuna nuova entry in statiHistory".
- Verification: l'AC ora copre sia failure code/message sia assenza di side effect.

### Issue 3 - AC-6 non bloccava side effect in caso FORBIDDEN
- Problem: l'AC chiedeva solo `403`, ma non stabiliva che stato/storico non devono cambiare.
- Fix applied: aggiunti vincoli su stato invariato e storico non modificato.
- Verification: l'AC e' ora testabile con assert su 403 + immutabilita' dei dati.

### Issue 4 - Task di autorizzazione nel layer non corretto
- Problem: il task originale attribuiva al route layer il controllo "admin o tecnico assegnato", ma il controllo richiede accesso ai dati della riparazione ed e' logica di dominio.
- Fix applied: separati i task in route (solo `authenticate` + forwarding payload) e service (autorizzazione su attore e assegnazione).
- Verification: la task breakdown ora riflette responsabilita' coerenti con architettura esistente.
