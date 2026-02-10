## Story Validation Log - 1.5

### Issue 1

- Problem: AC-1 `Then` era non testabile a causa di testo corrotto (`role` troncato su riga separata), quindi l'asserzione sul payload non era deterministica.
- Fix proposed: riscrivere AC-1 con payload risposta esplicito e sintassi lineare.
- Fix applied: AC-1 `Then` ora richiede `response.body` con `{ id: 2, role: "COMMERCIALE", isActive: true|false }` e vincolo su campi invariati.
- Verification: e' possibile scrivere `expect(response.body.role).toBe("COMMERCIALE")` e verificare campi invariati.

### Issue 2

- Problem: AC-2 `Given` non definiva il precondition setup (utente `id=2` attivo) e risultava ambiguo rispetto ai seed test correnti.
- Fix proposed: rendere esplicito il setup iniziale necessario prima della chiamata di deactivate.
- Fix applied: AC-2 `Given` ora specifica che test/database setup imposta `id=2` con `isActive=true` prima della request.
- Verification: i test possono preparare stato noto prima di `PATCH /api/users/2/deactivate`.

### Issue 3

- Problem: AC-3 `Then` non usava riferimenti strutturati al payload errore (`response.body.error.*`), riducendo precisione assertiva.
- Fix proposed: definire path JSON esatti per `code` e `message`.
- Fix applied: AC-3 `Then` richiede `response.body.error.code = "LAST_ADMIN_DEACTIVATION_FORBIDDEN"` e message esatto.
- Verification: il test puo' verificare direttamente `expect(response.body.error.code)` e `expect(response.body.error.message)`.

### Issue 4

- Problem: Task breakdown non includeva un task esplicito per setup/reset deterministico dello store utenti necessario a coprire AC-2/AC-3.
- Fix proposed: aggiungere task dedicato agli helper di test in users-service.
- Fix applied: aggiunto Task 7 su estensione helper/reset in `packages/backend/src/services/users-service.ts`.
- Verification: tutte le AC hanno almeno un task implementativo e i test hanno setup deterministico dichiarato.
