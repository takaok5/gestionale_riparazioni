# Story 1.5 ATDD Mapping

## AC list (from story file)

### AC-1
Given I am authenticated as `ADMIN` with header `Authorization: Bearer <admin_access_token>` and user `id=2` exists with role `TECNICO`.
When I send `PUT /api/users/2` with JSON payload `{ "role": "COMMERCIALE" }`.
Then I receive `200` and `response.body` contains `{ id: 2, role: "COMMERCIALE", isActive: true|false }` while `username` and `email` stay unchanged.

Tests AC-1:
- `returns 200 and updates role to COMMERCIALE for user id=2`
- `keeps username/email unchanged when updating role`

### AC-2
Given I am authenticated as `ADMIN` and test/database setup has user `id=2` active (`isActive=true`) before the request.
When I send `PATCH /api/users/2/deactivate`.
Then I receive `200` and `response.body` contains `{ id: 2, isActive: false }`.

Tests AC-2:
- `returns 200 and sets isActive=false for user id=2`
- `returns payload containing id=2 and isActive=false after deactivation`

### AC-3
Given user `id=1` is the only active account with role `ADMIN` in the users store/database and I am authenticated as `ADMIN`.
When I send `PATCH /api/users/1/deactivate`.
Then I receive `400` with `response.body.error.code = "LAST_ADMIN_DEACTIVATION_FORBIDDEN"` and `response.body.error.message = "Cannot deactivate the last admin"`.

Tests AC-3:
- `returns 400 LAST_ADMIN_DEACTIVATION_FORBIDDEN when deactivating the only active admin`
- `returns exact error message for last admin deactivation attempt`

### AC-4
Given I am authenticated as `TECNICO` with header `Authorization: Bearer <tecnico_access_token>`.
When I send `PUT /api/users/2` with payload `{ "role": "COMMERCIALE" }`.
Then I receive `403` with `response.body.error.code = "FORBIDDEN"`.

Tests AC-4:
- `returns 403 FORBIDDEN when TECNICO calls PUT /api/users/2`
- `does not return successful user payload for forbidden TECNICO request`
