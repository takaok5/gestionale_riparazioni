# Story 2.1 Validation (Step 4)

## Issue 1
Problem: AC-1 aveva When generico ("la richiesta viene processata") e parte dell'azione era nel Given, riducendo testabilita.
Fix: separata azione esplicita in When (POST /api/clienti) e Then con output verificabile (201, id, codiceCliente).
Verification: AC-1 ora contiene Given specifico, When singolo e Then con assert diretti.

## Issue 2
Problem: AC-2 non dichiarava esplicitamente status/risultato verificabile; risultava parzialmente ambiguo lato test.
Fix: aggiunto payload completo, When esplicito e Then con 201 + creazione in tipologia AZIENDA e vincolo partita IVA 11 cifre.
Verification: AC-2 ora traducibile in test API con assert status e dati risposta.

## Issue 3
Problem: AC-5 aveva Then generico ("errori di validazione") senza regole concretamente assertabili.
Fix: specificate regole attese invalid_cap / invalid_provincia e payload concreto con valori invalidi.
Verification: AC-5 ora verificabile con assert su 400 + dettagli campo/regola.

## Issue 4
Problem: Task breakdown non copriva esplicitamente il mismatch autorizzazione (route attuale uthorize("ADMIN") vs requisito utente autenticato).
Fix: aggiunto task dedicato di allineamento policy auth.
Verification: coverage task ora esplicita per gap autorizzativo.
