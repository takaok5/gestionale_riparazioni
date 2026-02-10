# Epic 2: Gestione Anagrafiche (FR-002, FR-003)

Gestione completa di clienti e fornitori con validazione dati fiscali, auto-generazione codici, e storico operazioni.

## Story 2.1: Creazione Cliente

**As a** Commerciale, **I want** to create a new customer record with validated fiscal data, **so that** I can manage customer information correctly.

### Acceptance Criteria
- **AC-1:** Given I am authenticated When I POST /api/clienti with { nome: "Rossi Mario", tipologia: "PRIVATO", codiceFiscale: "RSSMRA80A01H501U", telefono: "3331234567", email: "mario@test.it", indirizzo: "Via Roma 1", cap: "00100", citta: "Roma", provincia: "RM" } Then cliente is created with auto-generated codiceCliente "CLI-000001", I receive 201
- **AC-2:** Given I am authenticated When I POST /api/clienti with tipologia "AZIENDA" and partitaIva "12345678901" Then cliente is created with validated P.IVA format (11 digits)
- **AC-3:** Given I am authenticated When I POST /api/clienti with invalid codiceFiscale "INVALID" Then I receive 400 with validation error "Invalid fiscal code format"
- **AC-4:** Given a cliente with email "duplicate@test.it" exists When I POST /api/clienti with same email Then I receive 409 with error "EMAIL_ALREADY_EXISTS"
- **AC-5:** Given I am authenticated When I POST /api/clienti with cap "ABC" or provincia "ZZ" Then I receive 400 with validation errors for postal code and province fields

**Complexity:** M

**Dependencies:** none

---

## Story 2.2: Lista e Ricerca Clienti

**As a** Commerciale, **I want** to search and filter customers, **so that** I can quickly find customer information.

### Acceptance Criteria
- **AC-1:** Given 25 clienti exist When I GET /api/clienti?page=1&limit=10 Then I receive 200 with data array of 10 clienti and meta { page: 1, limit: 10, total: 25, totalPages: 3 }
- **AC-2:** Given clienti with names containing "Rossi" exist When I GET /api/clienti?search=Rossi Then I receive only clienti matching "Rossi" in nome or codiceCliente fields
- **AC-3:** Given clienti with tipologia PRIVATO and AZIENDA exist When I GET /api/clienti?tipologia=AZIENDA Then I receive only clienti with tipologia "AZIENDA"

**Complexity:** S

**Dependencies:** 2.1

---

## Story 2.3: Dettaglio e Modifica Cliente

**As a** Commerciale, **I want** to view and edit customer details with repair history, **so that** I can maintain accurate customer records.

### Acceptance Criteria
- **AC-1:** Given cliente id=5 exists When I GET /api/clienti/5 Then I receive 200 with full cliente data including all fields
- **AC-2:** Given cliente id=999 does not exist When I GET /api/clienti/999 Then I receive 404 with error "CLIENTE_NOT_FOUND"
- **AC-3:** Given cliente id=5 exists When I PUT /api/clienti/5 with { telefono: "3339876543", email: "newemail@test.it" } Then cliente is updated, I receive 200 with updated data
- **AC-4:** Given cliente id=5 has 3 riparazioni When I GET /api/clienti/5/riparazioni Then I receive array of 3 riparazioni with fields { id, codiceRiparazione, stato, dataRicezione, tipoDispositivo }

**Complexity:** M

**Dependencies:** 2.1, 2.2

---

## Story 2.4: Creazione Fornitore

**As an** Admin, **I want** to create a new supplier record with validated data, **so that** I can manage supplier relationships.

### Acceptance Criteria
- **AC-1:** Given I am Admin When I POST /api/fornitori with { nome: "Ricambi SRL", categoria: "RICAMBI", partitaIva: "12345678901", telefono: "0612345678", email: "info@ricambi.it", indirizzo: "Via Milano 10", cap: "20100", citta: "Milano", provincia: "MI" } Then fornitore is created with auto-generated codiceFornitore "FOR-000001", I receive 201
- **AC-2:** Given I am Admin When I POST /api/fornitori with categoria "SERVIZI" Then fornitore is created with categoria "SERVIZI"
- **AC-3:** Given I am Admin When I POST /api/fornitori with invalid partitaIva "123" Then I receive 400 with validation error "P.IVA must be 11 digits"
- **AC-4:** Given a fornitore with partitaIva "11111111111" exists When I POST /api/fornitori with same partitaIva Then I receive 409 with error "PARTITA_IVA_EXISTS"
- **AC-5:** Given I am Tecnico When I POST /api/fornitori Then I receive 403 "FORBIDDEN"

**Complexity:** M

**Dependencies:** none

---

## Story 2.5: Lista e Ricerca Fornitori

**As an** Admin, **I want** to search and filter suppliers, **so that** I can manage supplier information.

### Acceptance Criteria
- **AC-1:** Given 15 fornitori exist When I GET /api/fornitori?page=1&limit=20 Then I receive 200 with data array of 15 fornitori and meta { page: 1, limit: 20, total: 15 }
- **AC-2:** Given fornitori with categoria RICAMBI and SERVIZI exist When I GET /api/fornitori?categoria=RICAMBI Then I receive only fornitori with categoria "RICAMBI"
- **AC-3:** Given fornitori exist When I GET /api/fornitori?search=SRL Then I receive fornitori matching "SRL" in nome or codiceFornitore fields

**Complexity:** S

**Dependencies:** 2.4

---

## Story 2.6: Dettaglio e Modifica Fornitore

**As an** Admin, **I want** to view and edit supplier details with order history, **so that** I can maintain supplier records.

### Acceptance Criteria
- **AC-1:** Given fornitore id=3 exists When I GET /api/fornitori/3 Then I receive 200 with full fornitore data
- **AC-2:** Given fornitore id=3 exists When I PUT /api/fornitori/3 with { telefono: "0687654321", categoria: "ALTRO" } Then fornitore is updated, I receive 200
- **AC-3:** Given fornitore id=3 has 5 ordini When I GET /api/fornitori/3/ordini Then I receive array of 5 ordini with fields { id, numeroOrdine, stato, dataOrdine, totale }
- **AC-4:** Given I am Tecnico When I PUT /api/fornitori/3 Then I receive 403

**Complexity:** M

**Dependencies:** 2.4, 2.5

---
