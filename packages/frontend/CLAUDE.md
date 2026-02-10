# packages/frontend

## Role
React SPA per il gestionale. Interfaccia utente per tutte le operazioni: riparazioni, clienti, fornitori, preventivi, fatture, magazzino, ordini, report, audit log.

## Pattern
- **React Router DOM 7** con lazy loading per le pagine
- **AuthContext** per stato autenticazione (JWT tokens + user info)
- **Custom hooks** (`useApi`, `usePagination`, `useAuth`) per logica riutilizzabile
- **shadcn/ui** come component library base + Tailwind CSS per styling
- **React Hook Form + Zod** per form validation (validators da `@gestionale/shared`)
- **Componenti shared**: DataTable, FormField, SearchInput, ConfirmDialog, Badge, Toast, ProtectedRoute
- **ProtectedRoute** guard basato su ruolo utente
- **Fetch wrapper** (`lib/api.ts`) con auto-refresh token e gestione errori

## Key Files
- `src/main.tsx` — Entry point React
- `src/App.tsx` — Root component + router
- `src/contexts/AuthContext.tsx` — Provider autenticazione
- `src/hooks/useApi.ts` — Custom hook per chiamate API
- `src/lib/api.ts` — Fetch wrapper con JWT auto-refresh
- `src/components/shared/` — Componenti riutilizzabili
- `src/pages/` — Pagine organizzate per dominio

## Anti-Pattern
- NO inline styles (usare Tailwind)
- NO inline objects/functions in JSX props (causa re-render)
- NO useEffect senza deps array esplicito
- NO `any` senza commento giustificativo
- NO logica di business nel frontend (delegare al backend)
- NO token JWT esposto in URL o localStorage (usare httpOnly cookie o memory)

_See root CLAUDE.md for global rules_
