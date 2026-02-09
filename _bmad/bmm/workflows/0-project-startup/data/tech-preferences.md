# Tech Preferences

This file contains common tech preferences for suggesting stacks during Step 3 (Architecture). Claude uses these as a starting point; the user can override any choice via elicitation.

## Recommended Stacks by Project Type

### Full-Stack Web App (TypeScript)
- **Runtime:** Node.js 20 LTS
- **Backend:** Express 5 / Fastify
- **Frontend:** React 18 + Vite
- **Database:** PostgreSQL + Prisma / SQLite + better-sqlite3 (for small projects)
- **Styling:** Tailwind CSS
- **Testing:** Vitest + Playwright
- **Linter:** ESLint + Prettier

### Full-Stack Web App (Python)
- **Runtime:** Python 3.12+
- **Backend:** FastAPI / Django
- **Frontend:** React 18 + Vite (or HTMX for simple)
- **Database:** PostgreSQL + SQLAlchemy / SQLite
- **Testing:** pytest + Playwright
- **Linter:** Ruff

### API Backend Only
- **Runtime:** Node.js 20 LTS / Python 3.12+
- **Framework:** Express 5 / FastAPI
- **Database:** PostgreSQL + Prisma
- **Testing:** Vitest / pytest
- **Docs:** OpenAPI / Swagger

### CLI Tool
- **Runtime:** Node.js 20 LTS / Python 3.12+ / Rust
- **Framework:** Commander.js / Click / Clap
- **Testing:** Vitest / pytest / cargo test
- **Distribution:** npm / pip / cargo

### Mobile App
- **Framework:** React Native + Expo
- **State:** Zustand / Jotai
- **Backend:** Supabase / Firebase
- **Testing:** Jest + Detox

## Cross-Cutting Preferences

### Package Management
- **Preferred:** npm (for simplicity) or pnpm (for monorepo)
- **Avoid:** yarn classic (deprecated)

### TypeScript Config
- **Strict mode:** ALWAYS enabled
- **Target:** ES2022 (native top-level await support, etc.)
- **Module:** ESNext with NodeNext resolution

### Testing Philosophy
- **TDD mandatory** (test before code)
- **Minimum coverage:** 80% for unit, critical paths for E2E
- **Naming:** `{name}.test.ts` co-located with the tested file
- **Pattern:** Arrange-Act-Assert for unit, Given-When-Then for BDD

### Git & Commit
- **Branch naming:** feature/{slug}, fix/{slug}, chore/{slug}
- **Commit style:** Conventional Commits (feat:, fix:, chore:, docs:)
- **Commit language:** English
- **Atomic commits:** One thing per commit

### Code Quality
- **Named exports** (no default export for utilities)
- **Prefer `unknown` + type guard** over `any`
- **No `console.log`** in production (use structured logger)
- **Error handling:** Result pattern or typed Error subclasses
- **No barrel files** (`index.ts` that re-export everything) for performance

### Database
- **Migrations:** Always versionable and reversible
- **Schema:** Schema-first (not code-first for serious projects)
- **Multi-tenant:** ALWAYS include tenantId if multi-tenant
- **No SELECT *:** Never in production

### Frontend Patterns
- **Functional components** only (no class components in React)
- **Custom hooks** for reusable logic
- **No inline objects/functions** in JSX props (causes re-render)
- **Deps array** ALWAYS explicit in useEffect/useCallback/useMemo
- **Code splitting** via lazy loading per route
