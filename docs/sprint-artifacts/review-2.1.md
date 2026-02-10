---
story_id: '2.1'
reviewed_at: '2026-02-10T19:28:16.6882965+01:00'
status: resolved
---

# Review 2.1

### Issue 1
Status: RESOLVED
Problem: validazione provincia troppo permissiva (isValidProvinciaCode accettava qualunque sigla a 2 lettere escluso ZZ), con rischio dati anagrafici non validi.
Fix: introdotto set VALID_PROVINCE_CODES e check di membership in packages/backend/src/services/anagrafiche-service.ts.
Verification: test AC-5 (invalid_provincia) passa e la validazione rifiuta codici non presenti nel set.

### Issue 2
Status: RESOLVED
Problem: controllo email duplicata pre-insert non atomico in DB (race condition possibile su richieste concorrenti).
Fix: rimosso il pre-check fragile e gestito il conflitto via vincolo unico + mapping P2002 su EMAIL_ALREADY_EXISTS in createClienteInDatabase.
Verification: test AC-4 passa; il mapping errore in route restituisce 409 EMAIL_ALREADY_EXISTS.

### Issue 3
Status: RESOLVED
Problem: generazione codiceCliente poteva collidere in concorrenza e fallire senza retry.
Fix: aggiunto retry bounded (MAX_CODICE_CLIENTE_GENERATION_ATTEMPTS) su collisione codiceCliente in createClienteInDatabase.
Verification: suite backend passa; il codice ora gestisce collisioni transitorie con tentativi successivi.
