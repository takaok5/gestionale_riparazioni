# ATDD Mapping - Story 2.1

## AC-1
Given: sono autenticato come utente applicativo e ho il payload { nome: "Rossi Mario", tipologia: "PRIVATO", codiceFiscale: "RSSMRA80A01H501U", telefono: "3331234567", email: "mario@test.it", indirizzo: "Via Roma 1", cap: "00100", citta: "Roma", provincia: "RM" }
When: invio POST /api/clienti con quel payload
Then: ricevo 201 con body contenente almeno { id: <number>, codiceCliente: "CLI-000001" } e il record cliente viene creato con i valori inviati
Tests AC-1: verifica creazione da utente autenticato non-admin e verifica codice cliente auto-generato in risposta.

## AC-2
Given: sono autenticato e ho il payload { nome: "ACME SRL", tipologia: "AZIENDA", partitaIva: "12345678901", email: "acme@test.it", indirizzo: "Via Milano 10", cap: "20100", citta: "Milano", provincia: "MI" }
When: invio POST /api/clienti con quel payload
Then: ricevo 201 e la partita IVA viene accettata solo se composta da 11 cifre, con cliente creato in tipologia AZIENDA
Tests AC-2: verifica accettazione payload azienda con P.IVA valida e rifiuto P.IVA non valida.

## AC-3
Given: sono autenticato e ho il payload { nome: "Mario Rossi", tipologia: "PRIVATO", codiceFiscale: "INVALID", email: "mario.invalid@test.it", indirizzo: "Via Roma 1", cap: "00100", citta: "Roma", provincia: "RM" }
When: invio POST /api/clienti con quel payload
Then: ricevo 400 con errore di validazione "Invalid fiscal code format" associato al campo codiceFiscale
Tests AC-3: verifica errore 400 su CF invalido e dettaglio campo/regola messaggio.

## AC-4
Given: esiste gia un cliente con email "duplicate@test.it"
When: invio POST /api/clienti con la stessa email "duplicate@test.it"
Then: ricevo 409 con errore "EMAIL_ALREADY_EXISTS"
Tests AC-4: verifica conflitto 409 alla seconda creazione e payload errore coerente.

## AC-5
Given: sono autenticato e ho il payload { nome: "Mario Rossi", tipologia: "PRIVATO", codiceFiscale: "RSSMRA80A01H501U", email: "cap.invalid@test.it", indirizzo: "Via Roma 1", cap: "ABC", citta: "Roma", provincia: "ZZ" }
When: invio POST /api/clienti con quel payload
Then: ricevo 400 con errore di validazione sui campi cap e/o provincia (regole invalid_cap e invalid_provincia)
Tests AC-5: verifica errore su provincia non valida e su CAP non numerico con dettaglio regola.
