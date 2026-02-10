# Epic 3: Gestione Riparazioni (FR-004)

Sistema completo per la gestione del ciclo di vita delle riparazioni, dall'accettazione alla consegna, con workflow di stati e assegnazione tecnici.

## Story 3.1: Creazione Riparazione

**As a** Tecnico, **I want** to create a new repair record, **so that** I can track a device from intake to delivery.

### Acceptance Criteria
- **AC-1:** Given I am authenticated When I POST /api/riparazioni with { clienteId: 5, tipoDispositivo: "Smartphone", marcaDispositivo: "Samsung", modelloDispositivo: "Galaxy S21", serialeDispositivo: "SN123456789", descrizioneProblema: "Schermo rotto", accessoriConsegnati: "Caricabatterie, custodia", priorita: "NORMALE" } Then riparazione is created with auto-generated codiceRiparazione "RIP-20260209-0001", initial stato "RICEVUTA", I receive 201
- **AC-2:** Given today is 2026-02-09 and 5 riparazioni already created today When I POST /api/riparazioni Then codiceRiparazione is "RIP-20260209-0006"
- **AC-3:** Given I am authenticated When I POST /api/riparazioni with clienteId=999 (non-existent) Then I receive 404 with error "CLIENTE_NOT_FOUND"
- **AC-4:** Given I am authenticated When I POST /api/riparazioni with missing tipoDispositivo field Then I receive 400 with validation error "tipoDispositivo is required"

**Complexity:** M

**Dependencies:** none

---

## Story 3.2: Lista e Filtro Riparazioni

**As a** Tecnico, **I want** to filter and search repairs, **so that** I can find relevant repairs quickly.

### Acceptance Criteria
- **AC-1:** Given 30 riparazioni exist When I GET /api/riparazioni?page=1&limit=15 Then I receive 200 with data array of 15 riparazioni and meta { page: 1, limit: 15, total: 30, totalPages: 2 }
- **AC-2:** Given riparazioni with various stati exist When I GET /api/riparazioni?stato=IN_LAVORAZIONE Then I receive only riparazioni with stato "IN_LAVORAZIONE"
- **AC-3:** Given riparazioni assigned to tecnico id=3 exist When I GET /api/riparazioni?tecnicoId=3 Then I receive only riparazioni assigned to that tecnico
- **AC-4:** Given riparazioni with priorita ALTA and NORMALE exist When I GET /api/riparazioni?priorita=ALTA Then I receive only riparazioni with priorita "ALTA"
- **AC-5:** Given riparazioni created between 2026-02-01 and 2026-02-10 exist When I GET /api/riparazioni?dataRicezioneDa=2026-02-01&dataRicezioneA=2026-02-10 Then I receive riparazioni within that date range
- **AC-6:** Given riparazioni exist When I GET /api/riparazioni?search=Galaxy Then I receive riparazioni matching "Galaxy" in modelloDispositivo, marcaDispositivo, or codiceRiparazione fields

**Complexity:** M

**Dependencies:** 3.1

---

## Story 3.3: Dettaglio Riparazione

**As a** Tecnico, **I want** to view complete repair details with history, **so that** I have full context for the repair.

### Acceptance Criteria
- **AC-1:** Given riparazione id=10 exists When I GET /api/riparazioni/10 Then I receive 200 with full riparazione data including cliente { id, nome, telefono, email }, tecnico { id, username }, current stato
- **AC-2:** Given riparazione id=10 has changed stato 3 times When I GET /api/riparazioni/10 Then response includes statiHistory array with 3 entries showing { stato, dataOra, userId, note }
- **AC-3:** Given riparazione id=10 has 2 preventivi and 5 ricambi When I GET /api/riparazioni/10 Then response includes preventivi array and ricambi array with complete details
- **AC-4:** Given riparazione id=999 does not exist When I GET /api/riparazioni/999 Then I receive 404 with error "RIPARAZIONE_NOT_FOUND"

**Complexity:** M

**Dependencies:** 3.1, 3.2

---

## Story 3.4: Assegnazione Tecnico

**As an** Admin, **I want** to assign repairs to technicians, **so that** work is distributed among the team.

### Acceptance Criteria
- **AC-1:** Given I am Admin and user id=7 has role TECNICO When I PATCH /api/riparazioni/10/assegna with { tecnicoId: 7 } Then riparazione.tecnicoId is set to 7, I receive 200
- **AC-2:** Given I am Admin When I PATCH /api/riparazioni/10/assegna with tecnicoId=5 where user 5 has role COMMERCIALE Then I receive 400 with error "User must have TECNICO role"
- **AC-3:** Given riparazione id=10 is assigned to tecnico id=7 and I am Admin When I PATCH /api/riparazioni/10/assegna with { tecnicoId: 8 } Then tecnico is reassigned to 8
- **AC-4:** Given I am Tecnico (not Admin) When I PATCH /api/riparazioni/10/assegna Then I receive 403 "FORBIDDEN"

**Complexity:** S

**Dependencies:** 3.1

---

## Story 3.5: Cambio Stato Riparazione (Transizioni Base)

**As a** Tecnico, **I want** to update repair status following allowed transitions, **so that** repair progress is tracked correctly.

### Acceptance Criteria
- **AC-1:** Given I am assigned tecnico for riparazione id=10 with stato RICEVUTA When I PATCH /api/riparazioni/10/stato with { stato: "IN_DIAGNOSI", note: "Iniziata diagnosi" } Then stato changes to IN_DIAGNOSI, entry saved to RiparazioneStato history with timestamp and userId, I receive 200
- **AC-2:** Given riparazione stato is IN_DIAGNOSI When I PATCH /api/riparazioni/10/stato with { stato: "IN_LAVORAZIONE" } Then stato changes to IN_LAVORAZIONE
- **AC-3:** Given riparazione stato is IN_LAVORAZIONE When I PATCH /api/riparazioni/10/stato with { stato: "COMPLETATA" } Then stato changes to COMPLETATA
- **AC-4:** Given riparazione stato is COMPLETATA When I PATCH /api/riparazioni/10/stato with { stato: "CONSEGNATA" } Then stato changes to CONSEGNATA
- **AC-5:** Given riparazione stato is RICEVUTA When I PATCH /api/riparazioni/10/stato with { stato: "COMPLETATA" } Then I receive 400 with error "Invalid state transition from RICEVUTA to COMPLETATA"
- **AC-6:** Given I am not the assigned tecnico and not Admin When I PATCH /api/riparazioni/10/stato Then I receive 403 "FORBIDDEN"

**Complexity:** M

**Dependencies:** 3.1, 3.4

---

## Story 3.6: Cambio Stato Riparazione (Transizioni Preventivo)

**As a** Tecnico, **I want** to manage repair status transitions related to quotations, **so that** the approval workflow is enforced.

### Acceptance Criteria
- **AC-1:** Given riparazione stato is IN_DIAGNOSI When I PATCH /api/riparazioni/10/stato with { stato: "PREVENTIVO_EMESSO" } Then stato changes to PREVENTIVO_EMESSO
- **AC-2:** Given riparazione stato is PREVENTIVO_EMESSO When I PATCH /api/riparazioni/10/stato with { stato: "IN_ATTESA_APPROVAZIONE" } Then stato changes to IN_ATTESA_APPROVAZIONE
- **AC-3:** Given riparazione stato is IN_ATTESA_APPROVAZIONE When I PATCH /api/riparazioni/10/stato with { stato: "APPROVATA" } Then stato changes to APPROVATA
- **AC-4:** Given riparazione stato is IN_ATTESA_APPROVAZIONE When I PATCH /api/riparazioni/10/stato with { stato: "ANNULLATA" } Then stato changes to ANNULLATA
- **AC-5:** Given riparazione stato is APPROVATA When I PATCH /api/riparazioni/10/stato with { stato: "IN_ATTESA_RICAMBI" } Then stato changes to IN_ATTESA_RICAMBI
- **AC-6:** Given riparazione stato is APPROVATA When I PATCH /api/riparazioni/10/stato with { stato: "IN_LAVORAZIONE" } Then stato changes to IN_LAVORAZIONE
- **AC-7:** Given riparazione stato is IN_ATTESA_RICAMBI When I PATCH /api/riparazioni/10/stato with { stato: "IN_LAVORAZIONE" } Then stato changes to IN_LAVORAZIONE

**Complexity:** M

**Dependencies:** 3.5

---

## Story 3.7: Annullamento Riparazione (Admin)

**As an** Admin, **I want** to cancel a repair from any state, **so that** I can handle exceptional situations.

### Acceptance Criteria
- **AC-1:** Given I am Admin and riparazione id=10 has stato IN_LAVORAZIONE When I PATCH /api/riparazioni/10/stato with { stato: "ANNULLATA", note: "Cliente ha ritirato dispositivo" } Then stato changes to ANNULLATA, I receive 200
- **AC-2:** Given I am Admin and riparazione stato is RICEVUTA When I PATCH /api/riparazioni/10/stato with { stato: "ANNULLATA" } Then stato changes to ANNULLATA from initial state
- **AC-3:** Given I am Tecnico (not Admin) When I PATCH /api/riparazioni/10/stato with { stato: "ANNULLATA" } Then I receive 403 "Only admins can cancel repairs"

**Complexity:** S

**Dependencies:** 3.5

---
