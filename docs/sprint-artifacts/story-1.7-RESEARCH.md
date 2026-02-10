## Patterns Found

- `authsystem/models.py:87` usa signal `post_save` per creare `AuditLog` su create/update e `authsystem/models.py:115` usa `post_delete` per i delete.
- `authsystem/models.py:78` centralizza la condizione di audit in `should_audit_changes()`, utile per evitare log durante migrazioni.
- `anagrafiche/views.py:63` mostra il pattern `@transaction.atomic` + `JsonResponse` in `form_valid`, utile per consistenza e rollback.
- `anagrafiche/views.py:84` applica RBAC con `PermissionMixin` (`ADMIN` accesso completo, `TECNICO` sola lettura), pattern riusabile per `/api/audit-log`.
- `anagrafiche/views.py:36` usa `paginate_by = 10` nelle list view, riferimento per paginazione endpoint audit.

## Known Pitfalls

- L'attuale `AuditLog` salva `user=None`: senza propagare utente request-bound non si soddisfa AC-1 (`userId`).
- I signal `post_save` non hanno lo stato precedente; per AC-2 serve snapshot old/new prima del save o altra strategia equivalente.
- Le route correnti sono principalmente server-rendered (`/anagrafiche/...`), mentre la story richiede endpoint `/api/...`; rischio di mismatch URL/response format.
- Se non si limita il set di campi tracciati in `dettagli`, si rischiano payload troppo grandi o dati sensibili nel log.

## Stack/Libraries to Use

- Django class-based views + `JsonResponse` per endpoint API.
- Django signals (`post_save`, `post_delete`) per audit automatico.
- Django ORM con `select_related`/queryset filtrato per endpoint `GET /api/audit-log`.
- Django TestCase (`anagrafiche/tests.py`) per verificare create/update audit, filtro/paginazione e autorizzazioni.
