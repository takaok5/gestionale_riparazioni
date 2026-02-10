# Epic 6: Dashboard e Reportistica (FR-009, FR-010)

Dashboard personalizzate per ruolo e sistema di reportistica con KPI, metriche operative, e export dati.

## Story 6.1: Dashboard Operativa

**As a** user, **I want** a role-specific dashboard, **so that** I see relevant information for my work.

### Acceptance Criteria
- **AC-1:** Given I am Admin When I GET /api/dashboard Then I receive { riparazioniPerStato: { RICEVUTA: 5, IN_DIAGNOSI: 3, IN_LAVORAZIONE: 8, COMPLETATA: 2 }, caricoTecnici: [{ tecnicoId: 7, nome: "Mario Rossi", riparazioniAttive: 6 }], alertMagazzino: 4, ultimiPagamenti: [{ fatturaId: 8, importo: 244.00, data: "2026-02-09" }] }
- **AC-2:** Given I am Tecnico id=7 When I GET /api/dashboard Then I receive only my assigned riparazioni data { mieRiparazioni: { IN_DIAGNOSI: 2, IN_LAVORAZIONE: 4 }, nextRiparazioni: [...] }, no caricoTecnici or alertMagazzino
- **AC-3:** Given I am Commerciale When I GET /api/dashboard Then I receive { clientiAttivi: 45, preventiviPendenti: 3, fattureNonPagate: 7, fatturato30gg: 12500.00 }
- **AC-4:** Given I am unauthenticated When I GET /api/dashboard Then I receive 401 "Unauthorized"

**Complexity:** M

**Dependencies:** none

---

## Story 6.2: Dashboard Dettaglio Riparazioni per Stato

**As an** Admin, **I want** to see repair counts by status over time, **so that** I can monitor workflow.

### Acceptance Criteria
- **AC-1:** Given riparazioni with various stati exist When I GET /api/dashboard/riparazioni-per-stato Then I receive { RICEVUTA: 5, IN_DIAGNOSI: 3, IN_LAVORAZIONE: 8, PREVENTIVO_EMESSO: 2, COMPLETATA: 4, CONSEGNATA: 10, ANNULLATA: 1 }
- **AC-2:** Given today is 2026-02-09 When I GET /api/dashboard/riparazioni-per-stato?periodo=today Then I receive counts only for riparazioni with dataRicezione=2026-02-09
- **AC-3:** Given week is 2026-02-03 to 2026-02-09 When I GET /api/dashboard/riparazioni-per-stato?periodo=week Then I receive counts for riparazioni within that week
- **AC-4:** Given month is February 2026 When I GET /api/dashboard/riparazioni-per-stato?periodo=month Then I receive counts for riparazioni in February 2026

**Complexity:** S

**Dependencies:** 6.1

---

## Story 6.3: Dashboard Carico Tecnici

**As an** Admin, **I want** to see workload per technician, **so that** I can balance assignments.

### Acceptance Criteria
- **AC-1:** Given tecnico id=7 has 6 riparazioni with stato IN_DIAGNOSI or IN_LAVORAZIONE, tecnico id=8 has 3 When I GET /api/dashboard/carico-tecnici Then I receive [{ tecnicoId: 7, username: "mario.rossi", nome: "Mario Rossi", riparazioniAttive: 6 }, { tecnicoId: 8, username: "anna.verdi", nome: "Anna Verdi", riparazioniAttive: 3 }]
- **AC-2:** Given I am Admin When I GET /api/dashboard/carico-tecnici Then response includes only users with role TECNICO
- **AC-3:** Given I am Tecnico When I GET /api/dashboard/carico-tecnici Then I receive 403 "Admin only"

**Complexity:** S

**Dependencies:** 6.1

---

## Story 6.4: Report Riparazioni

**As an** Admin, **I want** repair performance reports, **so that** I can analyze efficiency and bottlenecks.

### Acceptance Criteria
- **AC-1:** Given riparazioni completed in January 2026 When I GET /api/report/riparazioni?dateFrom=2026-01-01&dateTo=2026-01-31 Then I receive { totaleRiparazioni: 25, completate: 20, tempoMedioPerStato: { IN_DIAGNOSI: 2.5, IN_LAVORAZIONE: 5.0 }, tassoCompletamento: 80.0, countPerStato: { RICEVUTA: 1, COMPLETATA: 20, ANNULLATA: 4 } }
- **AC-2:** Given riparazioni for tecnico id=7 exist When I GET /api/report/riparazioni?tecnicoId=7 Then I receive report filtered only for that tecnico
- **AC-3:** Given I am Tecnico When I GET /api/report/riparazioni Then I receive 403 "Admin only"
- **AC-4:** Given riparazioni with varying durations When I GET /api/report/riparazioni Then tempoMedioPerStato shows average days spent in each stato

**Complexity:** M

**Dependencies:** 6.1

---

## Story 6.5: Report Finanziari

**As an** Admin, **I want** financial reports, **so that** I can track revenue and margins.

### Acceptance Criteria
- **AC-1:** Given fatture in January 2026 totaling 15000.00 EUR, pagamenti totaling 12000.00 When I GET /api/report/finanziari?dateFrom=2026-01-01&dateTo=2026-01-31 Then I receive { fatturato: 15000.00, incassato: 12000.00, margine: 5500.00, preventiviEmessi: 30, preventiviApprovati: 22, tassoApprovazione: 73.33 }
- **AC-2:** Given preventivi with stato APPROVATO and RIFIUTATO exist in period When I GET /api/report/finanziari?dateFrom=2026-02-01&dateTo=2026-02-28 Then tassoApprovazione is calculated as (approvati / totali) * 100
- **AC-3:** Given I am Commerciale When I GET /api/report/finanziari Then I receive 403 "Admin only"

**Complexity:** M

**Dependencies:** 6.1

---

## Story 6.6: Report Magazzino

**As an** Admin, **I want** inventory reports, **so that** I can optimize stock levels and identify usage patterns.

### Acceptance Criteria
- **AC-1:** Given articoli with various giacenze and prezzi When I GET /api/report/magazzino Then I receive { valoreGiacenze: 25000.00, articoliEsauriti: 3, articoliSottoSoglia: 5, topArticoliUtilizzati: [{ articoloId: 5, nome: "Display Samsung S21", quantitaUtilizzata: 45 }] }
- **AC-2:** Given articolo id=5 has giacenza 0 and sogliaMinima > 0 When I GET /api/report/magazzino Then articolo 5 is counted in articoliEsauriti
- **AC-3:** Given movimenti SCARICO for various articoli in last 30 days When I GET /api/report/magazzino Then topArticoliUtilizzati shows top 10 articoli by quantita scaricata
- **AC-4:** Given I am Tecnico When I GET /api/report/magazzino Then I receive 403 "Admin only"

**Complexity:** M

**Dependencies:** 6.1

---

## Story 6.7: Export Report

**As an** Admin, **I want** to export reports as CSV, **so that** I can analyze data in Excel.

### Acceptance Criteria
- **AC-1:** Given riparazioni exist When I GET /api/report/export/riparazioni?dateFrom=2026-01-01&dateTo=2026-01-31 Then I receive CSV file with headers "codiceRiparazione,cliente,tecnico,stato,dataRicezione,dataCompletamento" and content-type text/csv
- **AC-2:** Given fatture exist When I GET /api/report/export/finanziari?dateFrom=2026-01-01&dateTo=2026-01-31 Then I receive CSV with fatture data
- **AC-3:** Given articoli exist When I GET /api/report/export/magazzino Then I receive CSV with articoli and giacenze
- **AC-4:** Given I am Tecnico When I GET /api/report/export/riparazioni Then I receive 403 "Admin only"

**Complexity:** S

**Dependencies:** 6.4, 6.5, 6.6

---
