# Epic 1: Autenticazione e Gestione Utenti (FR-001, FR-014)

Sistema di autenticazione JWT, gestione utenti con ruoli (ADMIN, TECNICO, COMMERCIALE), e audit trail automatico per tracciamento operazioni.

## Story 1.1: Login Utente

**As a** Tecnico, **I want** to log in with my credentials, **so that** I can access the system with my role permissions.

### Acceptance Criteria
- **AC-1:** Given a user with username "mario.rossi" and password "Password1" exists When I POST /api/auth/login with those credentials Then I receive 200 with accessToken (JWT 15min), refreshToken (7d), and user { id, username, email, role }
- **AC-2:** Given no user with username "utente.inesistente" exists When I POST /api/auth/login Then I receive 401 with error code "INVALID_CREDENTIALS"
- **AC-3:** Given a user with isActive=false When I POST /api/auth/login Then I receive 401 with error code "ACCOUNT_DISABLED"
- **AC-4:** Given 5 failed login attempts from same IP in 1 minute When I attempt a 6th login Then I receive 429 with retryAfter header

**Complexity:** M

**Dependencies:** none

---

## Story 1.2: Token Refresh e Logout

**As a** Tecnico, **I want** my session to refresh automatically and log out securely, **so that** I stay authenticated during work.

### Acceptance Criteria
- **AC-1:** Given a valid refreshToken When I POST /api/auth/refresh Then I receive new accessToken and refreshToken, old refreshToken invalidated
- **AC-2:** Given an expired refreshToken When I POST /api/auth/refresh Then I receive 401 with error "INVALID_REFRESH_TOKEN"
- **AC-3:** Given I am authenticated When I POST /api/auth/logout with my refreshToken Then token is invalidated, I receive 200

**Complexity:** S

**Dependencies:** 1.1

---

## Story 1.3: Creazione Utente (Admin)

**As an** Admin, **I want** to create new user accounts with a specific role, **so that** new team members can access the system.

### Acceptance Criteria
- **AC-1:** Given I am Admin When I POST /api/users with { username: "nuovo.utente", email: "nuovo@test.it", password: "Password1", role: "TECNICO" } Then user is created, I receive 201 with user data
- **AC-2:** Given I am Admin When I POST /api/users with an existing username Then I receive 409 with error "USERNAME_EXISTS"
- **AC-3:** Given I am Admin When I POST /api/users with password "abc" (less than 8 chars) Then I receive 400 with validation error on password field
- **AC-4:** Given I am Tecnico When I POST /api/users Then I receive 403 "FORBIDDEN"

**Complexity:** M

**Dependencies:** 1.1, 1.2

---

## Story 1.4: Lista e Dettaglio Utenti (Admin)

**As an** Admin, **I want** to view all users and their details, **so that** I can monitor team accounts.

### Acceptance Criteria
- **AC-1:** Given I am Admin and 5 users exist When I GET /api/users?page=1&limit=50 Then I receive 200 with data array of 5 users (without password field) and meta { page: 1, limit: 50, total: 5 }
- **AC-2:** Given I am Admin When I GET /api/users?role=TECNICO Then I receive only users with role TECNICO
- **AC-3:** Given I am Admin When I GET /api/users/1 Then I receive user details for id=1 without password field

**Complexity:** S

**Dependencies:** 1.3

---

## Story 1.5: Modifica e Disattivazione Utente (Admin)

**As an** Admin, **I want** to edit user roles and deactivate accounts, **so that** I can manage access and permissions.

### Acceptance Criteria
- **AC-1:** Given I am Admin When I PUT /api/users/2 with { role: "COMMERCIALE" } Then user role is updated, I receive 200
- **AC-2:** Given I am Admin When I PATCH /api/users/2/deactivate Then user.isActive becomes false, I receive 200
- **AC-3:** Given user id=1 is the only Admin When I PATCH /api/users/1/deactivate Then I receive 400 with error "Cannot deactivate the last admin"
- **AC-4:** Given I am Tecnico When I PUT /api/users/2 Then I receive 403

**Complexity:** M

**Dependencies:** 1.4

---

## Story 1.6: Cambio Password Propria

**As a** Tecnico, **I want** to change my password, **so that** I can keep my account secure.

### Acceptance Criteria
- **AC-1:** Given I am authenticated When I PUT /api/users/me/password with { currentPassword: "Password1", newPassword: "NewPass2" } Then password is updated, I receive 200
- **AC-2:** Given I am authenticated When I PUT /api/users/me/password with incorrect currentPassword Then I receive 400 "Current password is incorrect"
- **AC-3:** Given I am authenticated When I PUT /api/users/me/password with newPassword "abc" Then I receive 400 with validation errors (min 8 chars, 1 uppercase, 1 number)

**Complexity:** S

**Dependencies:** 1.1

---

## Story 1.7: Audit Trail Automatico

**As an** Admin, **I want** every CRUD operation to be automatically logged, **so that** I can track who did what and when.

### Acceptance Criteria
- **AC-1:** Given I create a Cliente via POST /api/clienti Then an AuditLog entry is created with { userId: myId, action: "CREATE", modelName: "Cliente", objectId: newId, timestamp }
- **AC-2:** Given I update Fornitore id=5 Then an AuditLog is created with action "UPDATE" and dettagli containing { old: {...}, new: {...} }
- **AC-3:** Given I am Admin When I GET /api/audit-log?modelName=Cliente&page=1 Then I receive only AuditLog entries for model "Cliente", paginated
- **AC-4:** Given I am Tecnico When I GET /api/audit-log Then I receive 403

**Complexity:** M

**Dependencies:** 1.1

---
