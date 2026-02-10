## ATDD Mapping - Story 1.6

### Tests AC-1

- **Given** I am authenticated with header `Authorization: Bearer <access_token>` for user `username="mario.rossi"` whose current password is `"Password1"`
- **When** I send `PUT /api/users/me/password` with JSON payload `{ "currentPassword": "Password1", "newPassword": "NewPass2" }`
- **Then** I receive HTTP `200` with `response.body.success = true`, login with `NewPass2` returns `200`, and login with old password `Password1` returns `401` `INVALID_CREDENTIALS`
- Test file: `packages/backend/src/__tests__/users-change-password.spec.ts`

### Tests AC-2

- **Given** I am authenticated with header `Authorization: Bearer <access_token>` for user `username="mario.rossi"`
- **When** I send `PUT /api/users/me/password` with JSON payload `{ "currentPassword": "WrongPass9", "newPassword": "NewPass2" }`
- **Then** I receive HTTP `400` with `error.code = CURRENT_PASSWORD_INCORRECT` and exact message
- Test file: `packages/backend/src/__tests__/users-change-password.spec.ts`

### Tests AC-3

- **Given** I am authenticated with header `Authorization: Bearer <access_token>` for user `username="mario.rossi"`
- **When** I send `PUT /api/users/me/password` with JSON payload `{ "currentPassword": "Password1", "newPassword": "abc" }`
- **Then** I receive HTTP `400` with `VALIDATION_ERROR`, message `Payload non valido`, and details `{ field, rule, min, requiresUppercase, requiresNumber }`
- Test file: `packages/backend/src/__tests__/users-change-password.spec.ts`
