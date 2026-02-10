## Story Validation Log - 1.6

### Issue 1

- Problem: AC-1 `Then` era parzialmente ambiguo: dichiarava il cambio password ma non imponeva un segnale API esplicito (`response.body.success`) e non verificava invalidazione della vecchia password.
- Fix proposed: rendere il `Then` osservabile su tre assert deterministici (risposta endpoint, login con nuova password, login con vecchia password).
- Fix applied: AC-1 ora richiede `response.body.success = true`, login con `NewPass2` = `200`, login con `Password1` = `401 INVALID_CREDENTIALS`.
- Verification: il `Then` e' traducibile in assert puntuali `expect(status/code)` senza inferenze.

### Issue 2

- Problem: AC-2 `Then` validava solo il messaggio errore, lasciando non vincolato il codice dominio e quindi possibile match su errori sbagliati.
- Fix proposed: aggiungere il codice errore esplicito oltre al messaggio.
- Fix applied: AC-2 ora richiede `response.body.error.code = "CURRENT_PASSWORD_INCORRECT"` e message esatto.
- Verification: il test puo' distinguere in modo affidabile tra errori di validazione e current password errata.

### Issue 3

- Problem: AC-3 `Then` usava formulazione "containing" sui dettagli, troppo permissiva e non completamente deterministica.
- Fix proposed: vincolare il payload errore completo con codice, messaggio e oggetto details strutturato.
- Fix applied: AC-3 ora richiede `code = VALIDATION_ERROR`, `message = Payload non valido`, e details con campi/valori espliciti.
- Verification: gli assert possono verificare l'oggetto `details` con shape e valori attesi.