# Frontend Specification: Gestionale Riparazioni

## UI Framework & Tools

- **Framework:** React ^18.3.0 + Vite ^6.1.0 (hot reload, lazy loading per route)
- **Component Library:** shadcn/ui (accessible, customizable, built on Radix UI)
- **CSS:** Tailwind CSS ^3.4.0 (utility-first, responsive)
- **Routing:** React Router DOM ^7.1.0 (SPA client-side routing)
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod (shared validators from @gestionale/shared)
- **Font:** Inter (Google Fonts, sans-serif)

## Design Tokens

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| primary | blue-600 (#2563EB) | Azioni principali, link, sidebar active |
| primary-hover | blue-700 (#1D4ED8) | Hover su azioni principali |
| secondary | slate-600 (#475569) | Testo secondario |
| success | green-600 (#16A34A) | Stati positivi (completata, pagata) |
| warning | amber-500 (#F59E0B) | Stati attenzione (in attesa, in ritardo) |
| danger | red-600 (#DC2626) | Errori, annullata, elimina |
| info | sky-500 (#0EA5E9) | Informazioni, notifiche |
| background | white (#FFFFFF) | Sfondo principale |
| surface | slate-50 (#F8FAFC) | Sfondo card/sezioni |
| border | slate-200 (#E2E8F0) | Bordi |

### Typography

| Element | Class | Size |
|---------|-------|------|
| h1 | text-2xl font-semibold | 24px |
| h2 | text-xl font-semibold | 20px |
| h3 | text-lg font-semibold | 18px |
| body | text-sm | 14px |
| label | text-xs font-medium text-slate-500 | 12px |

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| page-padding | p-6 (24px) | Padding pagina |
| card-padding | p-4 (16px) | Padding card |
| form-gap | space-y-4 (16px) | Gap tra campi form |
| section-gap | space-y-6 (24px) | Gap tra sezioni |

### Shadows & Borders

| Token | Value |
|-------|-------|
| card | shadow-sm |
| dropdown | shadow-md |
| modal | shadow-lg |
| button | rounded-md (6px) |
| card | rounded-lg (8px) |
| input | rounded-md (6px) |
| badge | rounded-full |

### Badge Colori per Stato Riparazione

| Stato | Background | Text | Significato |
|-------|-----------|------|-------------|
| RICEVUTA | blue-100 | blue-700 | Neutro |
| IN_DIAGNOSI | purple-100 | purple-700 | In analisi |
| PREVENTIVO_EMESSO | amber-100 | amber-700 | Attenzione |
| IN_ATTESA_APPROVAZIONE | orange-100 | orange-700 | In attesa |
| APPROVATA | green-100 | green-700 | Positivo |
| IN_ATTESA_RICAMBI | yellow-100 | yellow-700 | In attesa |
| IN_LAVORAZIONE | indigo-100 | indigo-700 | Attivo |
| COMPLETATA | emerald-100 | emerald-700 | Successo |
| CONSEGNATA | slate-100 | slate-700 | Completato |
| ANNULLATA | red-100 | red-700 | Negativo |

## Layout

```
┌─────────────────────────────────────────────────────┐
│ Header (h-16, bg-white, border-b)                    │
│ [☰]  Logo Gestionale    [🔔 badge] [Avatar ▼ Logout] │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │ Main Content (bg-slate-50)               │
│ (w-64)   │                                          │
│ bg-white │ Breadcrumb: Dashboard > Riparazioni > #12│
│ border-r │                                          │
│          │ Page Title + Action Buttons               │
│ Nav      │ ┌──────────────────────────────────────┐ │
│ items    │ │ Content Card (bg-white, shadow-sm)   │ │
│ grouped  │ │                                      │ │
│ by       │ │ DataTable / Form / Detail View       │ │
│ section  │ │                                      │ │
│          │ └──────────────────────────────────────┘ │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

### Sidebar Navigation (per ruolo)

_Scope: area gestionale interna (staff). Portale cliente e vetrina pubblica hanno navigazioni dedicate._

**Tutti i ruoli:**
- Dashboard (Home icon)
- --- separator ---
- Riparazioni (Wrench icon)
- Clienti (Users icon)
- Fornitori (Truck icon)
- --- separator ---
- Preventivi (FileText icon)
- Fatture (Receipt icon)
- --- separator ---
- Magazzino (Package icon) [+ badge alert]
- Ordini (ShoppingCart icon)

**Solo Admin:**
- --- separator ---
- Report (BarChart icon)
- Utenti (UserCog icon)
- Audit Log (Shield icon)

### Responsive Breakpoints

| Breakpoint | Width | Sidebar | DataTable | Form |
|-----------|-------|---------|-----------|------|
| Mobile | < 768px | Hidden (hamburger overlay) | Card list | 1 colonna |
| Tablet | 768-1023px | Collapsed (icons, w-16, expand on hover) | Colonne ridotte | 2 colonne |
| Desktop | ≥ 1024px | Expanded (w-64) | Completa | 2-3 colonne |

## Pages / Views

_Route partition consigliata: vetrina su dominio root, area staff su `/app/*`, area cliente su `/portale/*`._

### Public (Marketing + Access)

| Route | Page | FR | PRD Flow |
|-------|------|-----|----------|
| / | HomePage | FR-016 | Flow 8 |
| /servizi | ServiziPage | FR-016 | Flow 8 |
| /contatti | ContattiPage | FR-016 | Flow 8 |
| /faq | FaqPage | FR-016 | Flow 8 |
| /richiedi-preventivo | RichiestaPreventivoPage | FR-016 | Flow 8 |
| /login | Login (Staff) | FR-001 | Flow 3 |
| /portale/login | PortalLogin | FR-015 | Flow 7 |

### Portal Cliente (Authenticated)

| Route | Page | FR | PRD Flow |
|-------|------|-----|----------|
| /portale | PortalDashboard | FR-015 | Flow 7 |
| /portale/ordini | PortalOrdiniList | FR-015 | Flow 7 |
| /portale/ordini/:id | PortalOrdineDetail | FR-015 | Flow 7 |
| /portale/riparazioni | PortalRiparazioniList | FR-015 | Flow 7 |
| /portale/riparazioni/:id | PortalRiparazioneDetail | FR-015 | Flow 7 |
| /portale/preventivi/:id | PortalPreventivoDetail | FR-015 | Flow 7 |
| /portale/fatture | PortalFattureList | FR-015 | Flow 7 |

### Authenticated (All Roles)

| Route | Page | FR | PRD Flow |
|-------|------|-----|----------|
| /app | Dashboard | FR-009 | Flow 5 |
| /riparazioni | RiparazioniList | FR-004 | Flow 1 |
| /riparazioni/nuova | RiparazioneForm | FR-004 | Flow 1 step 3-6 |
| /riparazioni/:id | RiparazioneDetail | FR-004 | Flow 1 step 8-20 |
| /clienti | ClientiList | FR-002 | Flow 6 |
| /clienti/nuovo | ClienteForm | FR-002 | Flow 6 |
| /clienti/:id | ClienteDetail | FR-002 | - |
| /clienti/:id/modifica | ClienteForm (edit) | FR-002 | - |
| /fornitori | FornitoriList | FR-003 | Flow 6 step 1-4 |
| /fornitori/nuovo | FornitoreForm | FR-003 | Flow 6 |
| /fornitori/:id | FornitoreDetail | FR-003 | - |
| /fornitori/:id/modifica | FornitoreForm (edit) | FR-003 | - |
| /preventivi | PreventiviList | FR-005 | Flow 4 |
| /preventivi/nuovo?riparazioneId=:id | PreventivoForm | FR-005 | Flow 4 step 1-6 |
| /preventivi/:id | PreventivoDetail | FR-005 | Flow 4 |
| /fatture | FattureList | FR-006 | Flow 4 step 10-16 |
| /fatture/:id | FatturaDetail | FR-006 | Flow 4 |
| /magazzino | ArticoliList | FR-007 | Flow 6 step 5-8 |
| /magazzino/nuovo | ArticoloForm | FR-007 | Flow 6 |
| /magazzino/:id | ArticoloDetail | FR-007 | - |
| /magazzino/:id/modifica | ArticoloForm (edit) | FR-007 | - |
| /ordini | OrdiniList | FR-008 | Flow 2 |
| /ordini/nuovo | OrdineForm | FR-008 | Flow 2 step 4 |
| /ordini/:id | OrdineDetail | FR-008 | Flow 2 |

### Admin Only

| Route | Page | FR | PRD Flow |
|-------|------|-----|----------|
| /report | ReportPage | FR-010 | Flow 5 step 5-9 |
| /utenti | UtentiList | FR-001 | - |
| /utenti/nuovo | UtenteForm | FR-001 | - |
| /audit-log | AuditLogList | FR-014 | - |

### Page Details

#### Login
- Form: username/email + password + submit
- Error display sotto i campi
- Redirect a /app dopo successo
- Link "Primo accesso? Contatta l'admin"

#### HomePage / ServiziPage (pubbliche)
- Hero con CTA principali: "Richiedi preventivo" e "Accedi al portale cliente"
- Sezione servizi con card (titolo, descrizione breve, prezzo indicativo, tempo medio)
- Blocchi trust (recensioni, FAQ, contatti, orari)
- Footer con privacy/cookie policy e contatti rapidi

#### RichiestaPreventivoPage (pubblica)
- Form guidato: dati contatto, dispositivo, problema, preferenza appuntamento
- Checkbox consenso privacy obbligatoria + anti-spam
- Submit -> stato "Richiesta inviata" con ticketId e conferma email

#### PortalDashboard
- Card riepilogo: ordini aperti, riparazioni attive, preventivi in attesa, fatture aperte
- Widget "Ultimi aggiornamenti" con timeline eventi cliente
- CTA rapide: apri ordine, apri riparazione, scarica ultimo documento

#### PortalRiparazioneDetail / PortalOrdineDetail
- Vista read-only per dati tecnici/commerciali non modificabili dal cliente
- Timeline stato con timestamp, note sintetiche e prossima azione prevista
- Download documenti collegati (preventivo, fattura, ricevuta)
- Azione contestuale su preventivo: approva/rifiuta (se in attesa)

#### Dashboard
- **Admin:** 4 card (riparazioni per stato, carico tecnici, alert magazzino, ultimi pagamenti) + lista riparazioni recenti
- **Tecnico:** Card riparazioni assegnate per stato + lista prossime
- **Commerciale:** Card clienti recenti + fatture in attesa + preventivi pendenti
- Filtro periodo (oggi/settimana/mese)

#### RiparazioneDetail
- Header: codice, stato badge, priorità badge, azioni (cambio stato dropdown, stampa etichetta, stampa ricevuta)
- Tab: Info (cliente, dispositivo, diagnosi) | Preventivi (lista) | Ricambi (lista + aggiungi) | Fattura | Timeline stati
- Timeline: lista verticale cambi stato con timestamp, utente, note

#### PreventivoForm
- Header: riparazione collegata (auto-populated)
- Tabella voci editable inline: tipo (select), descrizione (input), articolo (autocomplete da magazzino, solo se RICAMBIO), quantità, prezzo unitario, totale (calcolato)
- Bottoni: + Aggiungi voce, Salva bozza, Invia al cliente
- Footer: subtotale, IVA (%), importo IVA, totale (calcolo real-time)

## Component Hierarchy

```
App
├── AuthProvider (Context: JWT tokens + user info)
├── Router
│   ├── /login → Login
│   └── ProtectedRoute
│       └── Layout
│           ├── Sidebar
│           │   ├── SidebarItem (icon + label + badge)
│           │   └── SidebarSeparator
│           ├── Header
│           │   ├── MobileMenuButton
│           │   ├── Logo
│           │   ├── NotificationBell (badge count)
│           │   └── UserMenu (avatar + dropdown: profilo, cambio password, logout)
│           └── MainContent → Pages (lazy loaded)
│               ├── Dashboard
│               │   ├── StatCard (numero + label + icona + colore)
│               │   ├── RiparazioniPerStatoChart
│               │   ├── CaricoTecniciCard
│               │   ├── AlertMagazzinoCard
│               │   └── UltimiPagamentiCard
│               ├── Riparazioni
│               │   ├── RiparazioniList → DataTable
│               │   ├── RiparazioneForm → FormField[]
│               │   └── RiparazioneDetail
│               │       ├── RiparazioneHeader (codice, stato, priorità, azioni)
│               │       ├── CambioStatoDropdown → ConfirmDialog
│               │       ├── TabInfo / TabPreventivi / TabRicambi / TabFattura / TabTimeline
│               │       └── TimelineStato
│               ├── Clienti → ClientiList / ClienteDetail / ClienteForm
│               ├── Fornitori → FornitoriList / FornitoreDetail / FornitoreForm
│               ├── Preventivi → PreventiviList / PreventivoDetail / PreventivoForm
│               │   └── VociPreventivoTable (editable inline)
│               ├── Fatture → FattureList / FatturaDetail
│               │   └── PagamentoForm
│               ├── Magazzino → ArticoliList / ArticoloDetail / ArticoloForm
│               │   └── MovimentoForm
│               ├── Ordini → OrdiniList / OrdineDetail / OrdineForm
│               │   └── RicezioneForm
│               ├── Report → ReportRiparazioni / ReportFinanziari / ReportMagazzino
│               ├── Utenti → UtentiList / UtenteForm
│               └── AuditLog → AuditLogList
└── Shared Components
    ├── DataTable
    │   Props: columns, data, loading, pagination, onSort, onFilter, onPageChange
    │   Features: sort per colonna, filtri inline, paginazione, selezione righe, azioni riga
    │   Mobile: card list con campi principali
    ├── FormField
    │   Props: label, name, type, error, required, placeholder, options (for select)
    │   Types: text, email, select, textarea, date, number, checkbox
    │   Features: asterisco required, auto-focus primo errore
    ├── SearchInput
    │   Props: placeholder, onSearch, debounce (300ms default)
    │   Features: clear button (X), loading indicator
    ├── ConfirmDialog
    │   Props: title, message, onConfirm, onCancel, variant (danger/warning/info)
    │   Features: modal overlay blur, escape to close
    ├── Toast
    │   Position: top-right, stacked
    │   Variants: success, error, warning, info
    │   Features: auto-dismiss 5s, progress bar, close button
    ├── Badge
    │   Props: label, variant (colore per stato)
    │   Features: rounded-full, color mapping da stato
    ├── Spinner / Skeleton
    │   Features: loading states per componenti
    ├── PDFViewer
    │   Props: url
    │   Features: embed PDF inline o download
    └── ProtectedRoute
        Props: allowedRoles
        Redirect: /login se non autenticato, / se ruolo non autorizzato
```

### Component Additions (FR-015, FR-016)
- `PublicLayout`: header pubblico, nav servizi, footer legale
- `ServiceCard`: card servizio con CTA e metadati (prezzo/tempo)
- `LeadForm`: form richiesta preventivo/appuntamento con validazioni anti-spam
- `PortalAuthProvider`: stato autenticazione cliente separato da auth staff
- `PortalLayout`: shell area cliente con menu ridotto (dashboard, ordini, riparazioni, fatture)
- `PortalProtectedRoute`: guard per sessione cliente

## State Management

### Auth State (React Context)
- **AuthContext:** accessToken, refreshToken, user (id, username, email, role), isAuthenticated
- **AuthProvider:** gestisce login, logout, refresh automatico, persistenza token (localStorage)
- **useAuth hook:** accesso a context + helper (login, logout, hasRole)
- **PortalAuthContext:** portalAccessToken, portalRefreshToken, cliente, isPortalAuthenticated
- **PortalAuthProvider:** login/logout cliente, refresh token dedicato, storage separato da staff

### Server State (Custom Hooks)
- **useApi:** fetch wrapper con JWT auto-inject, refresh on 401, error handling
- **usePagination:** page, limit, total, changePage
- **Pattern:** ogni pagina fa fetch on mount + cache locale (useState). No state manager globale.
- **Refetch:** esplicito dopo mutazione (create/update/delete → refetch list)

### UI State (useState locale)
- Form state: React Hook Form (register, handleSubmit, errors)
- Dialog open/close: useState boolean
- Filtri attivi: useState + URL search params
- Sidebar collapsed: useState + localStorage persist

### Data Flow Pattern
```
User Action → Component → useApi(endpoint) → API Call
                              ↓
                         Loading State
                              ↓
                    Response → setState → Re-render
                              ↓ (error)
                         Toast Error
```

## Responsive Strategy

### Mobile-First Approach
Tutti gli stili partono da mobile, si espandono con breakpoints Tailwind (md:, lg:).

### Touch Targets
- Bottoni: min h-10 (40px) con padding adeguato
- Link/azioni: min h-10 per tap target
- Spacing tra elementi interattivi: min 8px

### Adattamenti per Breakpoint

| Componente | Mobile (< 768px) | Tablet (768-1023px) | Desktop (≥ 1024px) |
|-----------|-------------------|---------------------|---------------------|
| Sidebar | Hidden + hamburger overlay | Collapsed (icons w-16) | Expanded (w-64) |
| DataTable | Card list verticale | Tabella colonne ridotte | Tabella completa |
| Form | 1 colonna | 2 colonne (grid-cols-2) | 2-3 colonne |
| Dashboard cards | 1 per riga | 2 per riga | 4 per riga |
| Azioni riga | Menu ... (dropdown) | Menu ... | Bottoni inline |
| Modal/Dialog | Full screen | Centro con max-width | Centro con max-width |
| Header | Logo + hamburger + avatar | Logo + search + avatar | Completo |

### Progressive Enhancement
- Form funzionano senza JS (submit nativo come fallback)
- Immagini lazy loaded
- Code splitting per route (React.lazy + Suspense)
- Skeleton loader durante caricamento dati

## Key Interactions

### 1. Cambio Stato Riparazione
Da RiparazioneDetail → Header → dropdown "Cambia Stato":
1. Dropdown mostra solo transizioni valide (da matrice)
2. Click stato → ConfirmDialog con campo note (opzionale)
3. Conferma → PATCH /api/riparazioni/:id/stato
4. Successo → toast "Stato aggiornato" + refresh timeline + badge aggiornato
5. Errore → toast rosso con messaggio

### 2. Creazione Preventivo
Da RiparazioneDetail → Tab Preventivi → "Nuovo Preventivo":
1. Form con riparazione auto-populated
2. Tabella voci editable:
   - "+ Aggiungi voce" → nuova riga vuota
   - Tipo: select (manodopera/ricambio/altro)
   - Se RICAMBIO: autocomplete articolo da magazzino (mostra giacenza)
   - Quantità + prezzo → totale calcolato real-time
   - "X" per rimuovere voce
3. Footer: subtotale + IVA% + importo IVA + totale (aggiornato in real-time)
4. "Salva bozza" o "Invia al cliente"

### 3. Alert Magazzino
- Sidebar: icona Magazzino con badge rosso (count articoli sotto soglia)
- Dashboard: card "Alert Magazzino" con lista articoli critici
- Click articolo → ArticoloDetail → bottone "Crea Ordine Fornitore"

### 4. Ricerca e Filtri
- Ogni lista (List page) ha:
  - SearchInput (debounce 300ms, ricerca per nome/codice)
  - Filtri specifici (dropdown stato, tipologia, periodo)
  - Ordinamento per colonna (click header DataTable)
  - Paginazione (prev/next + numeri pagina)
- Filtri persistono in URL search params (condivisibili, back/forward funziona)

### 5. Richiesta Preventivo Pubblica
Da `/richiedi-preventivo`:
1. Utente compila dati contatto + dispositivo + problema
2. Conferma consenso privacy
3. Submit -> POST `/api/public/richieste`
4. Successo -> pagina conferma con codice ticket
5. Errore validazione -> messaggi inline per campo

### 6. Approvazione Preventivo da Portale Cliente
Da `PortalPreventivoDetail`:
1. Cliente apre preventivo in stato IN_ATTESA_APPROVAZIONE
2. Visualizza voci + totale + PDF allegato
3. Click "Approva" o "Rifiuta" -> ConfirmDialog
4. Conferma -> POST `/api/portal/preventivi/:id/risposta`
5. Successo -> aggiornamento badge stato + toast + refresh dashboard

---

_Generated by project-startup pipeline - Step 4: Frontend Spec_
