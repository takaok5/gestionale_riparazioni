# Epic 4: Preventivi e Fatturazione (FR-005, FR-006)

Gestione completa del ciclo preventivo-fattura, calcolo IVA automatico, generazione PDF, e tracciamento pagamenti.

## Story 4.1: Creazione Preventivo

**As a** Tecnico, **I want** to create a quotation with line items, **so that** I can propose repair costs to the customer.

### Acceptance Criteria
- **AC-1:** Given riparazione id=10 exists When I POST /api/preventivi with { riparazioneId: 10, voci: [{ tipo: "MANODOPERA", descrizione: "Sostituzione schermo", quantita: 1, prezzoUnitario: 80.00 }, { tipo: "RICAMBIO", descrizione: "Display LCD", articoloId: 5, quantita: 1, prezzoUnitario: 120.00 }] } Then preventivo is created with stato "BOZZA", subtotale 200.00, iva 44.00 (22%), totale 244.00, I receive 201
- **AC-2:** Given preventivo created with 3 voci When I GET /api/preventivi/:id Then response includes voci array with all 3 items and calculated totals
- **AC-3:** Given I POST /api/preventivi with riparazioneId=999 (non-existent) When request is made Then I receive 404 with error "RIPARAZIONE_NOT_FOUND"
- **AC-4:** Given I POST /api/preventivi with voce missing descrizione field When request is made Then I receive 400 with validation error "descrizione is required for each voce"

**Complexity:** M

**Dependencies:** none

---

## Story 4.2: Modifica Preventivo (Bozza)

**As a** Tecnico, **I want** to edit a draft quotation, **so that** I can adjust prices before sending to customer.

### Acceptance Criteria
- **AC-1:** Given preventivo id=5 has stato BOZZA When I PUT /api/preventivi/5 with { voci: [{ tipo: "MANODOPERA", descrizione: "Riparazione aggiornata", quantita: 2, prezzoUnitario: 90.00 }] } Then voci are replaced, totals recalculated (subtotale 180.00, iva 39.60, totale 219.60), I receive 200
- **AC-2:** Given preventivo id=5 has stato BOZZA When I PUT /api/preventivi/5 adding a new voce Then voci count increases and totals recalculated correctly
- **AC-3:** Given preventivo id=5 has stato INVIATO (not BOZZA) When I PUT /api/preventivi/5 Then I receive 400 with error "Cannot edit preventivo with stato INVIATO"
- **AC-4:** Given preventivo id=5 has stato APPROVATO When I PUT /api/preventivi/5 Then I receive 400 with error "Cannot edit preventivo with stato APPROVATO"

**Complexity:** M

**Dependencies:** 4.1

---

## Story 4.3: Invio Preventivo al Cliente

**As a** Commerciale, **I want** to send the quotation to the customer, **so that** they can review and approve it.

### Acceptance Criteria
- **AC-1:** Given preventivo id=5 has stato BOZZA and riparazione.cliente.email is "cliente@test.it" When I POST /api/preventivi/5/invia Then preventivo.stato becomes INVIATO, dataInvio is set to current timestamp, PDF is generated, email sent to cliente@test.it, riparazione.stato becomes IN_ATTESA_APPROVAZIONE, I receive 200
- **AC-2:** Given preventivo id=5 has stato INVIATO already When I POST /api/preventivi/5/invia Then I receive 400 with error "Preventivo already sent"
- **AC-3:** Given preventivo id=5 linked to riparazione with cliente having null email When I POST /api/preventivi/5/invia Then I receive 400 with error "Customer email is required to send quotation"
- **AC-4:** Given email service fails When I POST /api/preventivi/5/invia Then preventivo stato remains BOZZA, I receive 500 with error "Failed to send email"

**Complexity:** M

**Dependencies:** 4.1, 4.2

---

## Story 4.4: Approvazione/Rifiuto Preventivo

**As a** Commerciale, **I want** to record customer approval or rejection of a quotation, **so that** repair workflow continues correctly.

### Acceptance Criteria
- **AC-1:** Given preventivo id=5 has stato INVIATO When I PATCH /api/preventivi/5/risposta with { approvato: true } Then preventivo.stato becomes APPROVATO, dataRisposta is set, riparazione.stato becomes APPROVATA, I receive 200
- **AC-2:** Given preventivo id=5 has stato INVIATO When I PATCH /api/preventivi/5/risposta with { approvato: false } Then preventivo.stato becomes RIFIUTATO, riparazione.stato becomes ANNULLATA, I receive 200
- **AC-3:** Given preventivo id=5 has stato BOZZA When I PATCH /api/preventivi/5/risposta Then I receive 400 with error "Preventivo must be in INVIATO state to record response"
- **AC-4:** Given preventivo id=5 has stato APPROVATO already When I PATCH /api/preventivi/5/risposta Then I receive 400 with error "Response already recorded for this preventivo"

**Complexity:** M

**Dependencies:** 4.3

---

## Story 4.5: Generazione Fattura

**As a** Commerciale, **I want** to generate an invoice from an approved quotation, **so that** I can bill the customer.

### Acceptance Criteria
- **AC-1:** Given preventivo id=5 is APPROVATO with voci totaling 244.00 EUR When I POST /api/fatture with { riparazioneId: 10 } Then fattura is created with numeroFattura "2026/0001" (year/sequential), voci copied from preventivo, subtotale 200.00, iva 44.00, totale 244.00, stato EMESSA, PDF generated, I receive 201
- **AC-2:** Given today is 2026-02-09 and last fattura was 2026/0015 When I POST /api/fatture Then numeroFattura is "2026/0016"
- **AC-3:** Given riparazione id=10 has no APPROVATO preventivo When I POST /api/fatture with { riparazioneId: 10 } Then I receive 400 with error "No approved preventivo found for this riparazione"
- **AC-4:** Given fattura already exists for riparazione id=10 When I POST /api/fatture with { riparazioneId: 10 } Then I receive 409 with error "Invoice already exists for this riparazione"

**Complexity:** M

**Dependencies:** 4.4

---

## Story 4.6: Registrazione Pagamento

**As a** Commerciale, **I want** to record customer payments, **so that** I can track invoice payment status.

### Acceptance Criteria
- **AC-1:** Given fattura id=8 has totale 244.00 and no pagamenti When I POST /api/fatture/8/pagamenti with { importo: 244.00, metodo: "CONTANTE", dataPagamento: "2026-02-09" } Then pagamento is created, fattura.stato becomes PAGATA, I receive 201
- **AC-2:** Given fattura id=8 has totale 244.00 and existing pagamento of 100.00 When I POST /api/fatture/8/pagamenti with { importo: 144.00, metodo: "BONIFICO" } Then second pagamento is created, sum reaches 244.00, fattura.stato becomes PAGATA
- **AC-3:** Given fattura id=8 has totale 244.00 and pagamenti totaling 244.00 When I POST /api/fatture/8/pagamenti with { importo: 10.00 } Then I receive 400 with error "Total payments would exceed invoice total"
- **AC-4:** Given fattura id=8 has totale 244.00 and pagamento of 100.00 exists When I GET /api/fatture/8 Then response includes pagamenti array showing 100.00 paid, 144.00 remaining

**Complexity:** M

**Dependencies:** 4.5

---

## Story 4.7: Lista e Dettaglio Fatture

**As a** Commerciale, **I want** to view and filter invoices, **so that** I can manage billing and access invoice PDFs.

### Acceptance Criteria
- **AC-1:** Given 20 fatture exist When I GET /api/fatture?page=1&limit=10 Then I receive 200 with data array of 10 fatture and meta { page: 1, limit: 10, total: 20 }
- **AC-2:** Given fatture with stato EMESSA and PAGATA exist When I GET /api/fatture?stato=PAGATA Then I receive only fatture with stato PAGATA
- **AC-3:** Given fatture created in February 2026 exist When I GET /api/fatture?dataDa=2026-02-01&dataA=2026-02-28 Then I receive fatture within that date range
- **AC-4:** Given fattura id=8 has 2 pagamenti When I GET /api/fatture/8 Then I receive fattura details with pagamenti array showing both payments
- **AC-5:** Given fattura id=8 has generated PDF When I GET /api/fatture/8/pdf Then I receive PDF file with content-type application/pdf and correct filename

**Complexity:** S

**Dependencies:** 4.5, 4.6

---
