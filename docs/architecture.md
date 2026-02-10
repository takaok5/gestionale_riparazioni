# Architecture - Gestionale Riparazioni

## Stack
- Frontend: React + Vite
- Backend: Express + Prisma + PostgreSQL
- Shared: pacchetto tipi condivisi

## Backend Auth Flow

1. POST /api/auth/login valida credenziali e restituisce accessToken + refreshToken.
2. POST /api/auth/refresh valida refresh token e rinnova sessione.
3. Middleware auth verifica token bearer e autorizzazioni ruolo.

## Key Modules

- packages/backend/src/routes/auth.ts
- packages/backend/src/services/auth-service.ts
- packages/backend/src/middleware/auth.ts
- packages/shared/src/types/index.ts
