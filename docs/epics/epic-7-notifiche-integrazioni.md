# Epic 7: Notifiche e Integrazioni (FR-011, FR-012, FR-013)

Sistema di notifiche email automatiche, generazione documenti stampabili, e integrazione pagamenti online.

## Story 7.1: Invio Email Notifica Stato Riparazione

**As a** customer, **I want** to receive email notifications when my repair status changes, **so that** I stay informed.

### Acceptance Criteria
- **AC-1:** Given riparazione id=10 for cliente with email "cliente@test.it" When stato changes to RICEVUTA Then system auto-sends email to cliente@test.it with subject "Riparazione Ricevuta - RIP-20260209-0001", body from template includes codiceRiparazione and dispositivo info, Notifica record created with tipo "STATO_RIPARAZIONE", stato "INVIATA"
- **AC-2:** Given riparazione stato changes to COMPLETATA When stato update occurs Then email sent with subject "Riparazione Completata" and body includes "La sua riparazione è pronta per il ritiro"
- **AC-3:** Given riparazione stato changes to CONSEGNATA When stato update occurs Then email sent with subject "Riparazione Consegnata"
- **AC-4:** Given email service fails When riparazione stato changes Then Notifica record created with stato "FALLITA", error logged, riparazione stato change still succeeds

**Complexity:** M

**Dependencies:** none

---

## Story 7.2: Invio Email Preventivo

**As a** customer, **I want** to receive the quotation by email with PDF, **so that** I can review and approve it.

### Acceptance Criteria
- **AC-1:** Given preventivo id=5 for riparazione with cliente.email "cliente@test.it" When I POST /api/preventivi/5/invia Then email sent to cliente@test.it with subject "Preventivo - RIP-20260209-0001", PDF attachment named "preventivo-5.pdf", Notifica created with tipo "PREVENTIVO", allegato pointing to PDF path
- **AC-2:** Given preventivo with totale 244.00 EUR When email is sent Then email body includes preventivo details (voci, subtotale, IVA, totale) from template
- **AC-3:** Given email service fails When I POST /api/preventivi/5/invia Then Notifica created with stato "FALLITA", API returns 500 with error "Failed to send email"
- **AC-4:** Given preventivo sent successfully When I GET /api/notifiche?tipo=PREVENTIVO Then I see Notifica record with destinatario, dataInvio, stato

**Complexity:** M

**Dependencies:** 7.1

---

## Story 7.3: Log e Consultazione Notifiche

**As an** Admin, **I want** to view all sent notifications, **so that** I can verify customer communications.

### Acceptance Criteria
- **AC-1:** Given 50 notifiche exist When I GET /api/notifiche?page=1&limit=20 Then I receive 200 with data array of 20 notifiche showing { id, tipo, destinatario, oggetto, stato, dataInvio } and meta pagination
- **AC-2:** Given notifiche with tipo STATO_RIPARAZIONE and PREVENTIVO exist When I GET /api/notifiche?tipo=PREVENTIVO Then I receive only notifiche with tipo "PREVENTIVO"
- **AC-3:** Given notifiche with stato INVIATA and FALLITA exist When I GET /api/notifiche?stato=FALLITA Then I receive only failed notifications
- **AC-4:** Given notifiche sent in February 2026 When I GET /api/notifiche?dataDa=2026-02-01&dataA=2026-02-28 Then I receive notifiche within that date range
- **AC-5:** Given I am Tecnico When I GET /api/notifiche Then I receive 403 "Admin only"

**Complexity:** S

**Dependencies:** 7.1, 7.2

---

## Story 7.4: Stampa Etichetta Dispositivo

**As a** Tecnico, **I want** to print device labels, **so that** I can identify devices in the workshop.

### Acceptance Criteria
- **AC-1:** Given riparazione id=10 with codiceRiparazione "RIP-20260209-0001", cliente "Rossi Mario", dispositivo "Samsung Galaxy S21" When I GET /api/riparazioni/10/etichetta Then I receive PDF with content-type application/pdf, small format (62x100mm for label printer), includes QR code encoding "RIP-20260209-0001", text showing codiceRiparazione, cliente nome, marca and modello dispositivo, dataRicezione
- **AC-2:** Given riparazione without cliente nome When I GET /api/riparazioni/10/etichetta Then PDF includes codiceCliente instead of nome
- **AC-3:** Given riparazione id=999 does not exist When I GET /api/riparazioni/999/etichetta Then I receive 404 "RIPARAZIONE_NOT_FOUND"

**Complexity:** M

**Dependencies:** none

---

## Story 7.5: Stampa Ricevuta Accettazione

**As a** Tecnico, **I want** to print intake receipts, **so that** I can provide proof of device acceptance to customers.

### Acceptance Criteria
- **AC-1:** Given riparazione id=10 with complete data When I GET /api/riparazioni/10/ricevuta Then I receive PDF A4 format with sections: cliente data (nome, telefono, email), dispositivo (tipo, marca, modello, seriale), descrizioneProblema, accessoriConsegnati, dataRicezione, condizioni servizio (template text), firma section for cliente
- **AC-2:** Given riparazione has accessoriConsegnati "Caricabatterie, custodia" When I GET /api/riparazioni/10/ricevuta Then PDF lists each accessorio
- **AC-3:** Given riparazione created on 2026-02-09 When I GET /api/riparazioni/10/ricevuta Then PDF shows dataRicezione as "09/02/2026" formatted
- **AC-4:** Given I am unauthenticated When I GET /api/riparazioni/10/ricevuta Then I receive 401 "Unauthorized"

**Complexity:** M

**Dependencies:** 7.4

---

## Story 7.6: Pagamento Online (Stripe)

**As a** customer, **I want** to pay invoices online, **so that** I can complete payment conveniently.

### Acceptance Criteria
- **AC-1:** Given fattura id=8 with totale 244.00 EUR and stato EMESSA When I POST /api/pagamenti/crea-link/8 Then Stripe Checkout session is created, I receive 200 with { paymentUrl: "https://checkout.stripe.com/pay/cs_test_...", sessionId: "cs_test_..." }
- **AC-2:** Given fattura stato is PAGATA When I POST /api/pagamenti/crea-link/8 Then I receive 400 with error "Invoice is already paid"
- **AC-3:** Given Stripe sends webhook event "checkout.session.completed" with sessionId "cs_test_..." and metadata.fatturaId=8 When I POST /api/webhooks/stripe with event payload Then system auto-creates Pagamento entry with { fatturaId: 8, importo: 244.00, metodo: "STRIPE", dataPagamento: event.created }, fattura.stato becomes PAGATA, I receive 200
- **AC-4:** Given Stripe webhook signature is invalid When I POST /api/webhooks/stripe Then I receive 400 "Invalid signature"
- **AC-5:** Given payment already recorded for sessionId When I POST /api/webhooks/stripe with duplicate event Then system ignores duplicate (idempotency), returns 200

**Complexity:** M

**Dependencies:** none

---
