## Story Validation Log - 1.3

### Issue 1

- Problem: AC-1 had a `When` with two actions combined ("validates payload and creates"), making the action ambiguous.
- Fix proposed: make `When` a single explicit request action.
- Fix applied: AC-1 `When` changed to `I send POST /api/users with that header and payload`.
- Verification: AC-1 now has one clear trigger action, directly testable with one request.

### Issue 2

- Problem: AC-3 `Then` did not define a deterministic error payload shape for assertions.
- Fix proposed: specify exact `error.code` and required `error.details` keys.
- Fix applied: AC-3 `Then` now requires `error.code = "VALIDATION_ERROR"` and details `{ field: "password", rule: "min_length", min: 8 }`.
- Verification: expected response can be asserted with direct `expect(response.body.error...)`.

### Issue 3

- Problem: AC-4 `Given` was underspecified (`valid access token`) without concrete actor context.
- Fix proposed: bind the actor to a concrete role/user example and explicit auth header.
- Fix applied: AC-4 `Given` now uses `TECNICO` example user `mario.rossi` with `Authorization: Bearer <tecnico_access_token>`.
- Verification: setup is reproducible in integration tests (login -> token -> forbidden create).

### Issue 4

- Problem: Task breakdown did not explicitly cover AC-1 requirement to exclude password fields in response.
- Fix proposed: add dedicated task for response sanitization.
- Fix applied: added Task 7 for omitting `password`/`passwordHash`; added Task 8 for consistent `FORBIDDEN` error envelope.
- Verification: all ACs now map to at least one explicit implementation task.
