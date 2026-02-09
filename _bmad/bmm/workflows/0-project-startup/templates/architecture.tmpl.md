<!-- ANTI-HALLUCINATION: Every section MUST have an explicit source.
     Valid sources: user input, previous artifact, codebase scan.
     If source = "Claude hypothesis" -> ASK before writing. -->

# Architecture Document: {project_name}

## Tech Stack

### Languages & Runtime
- **Primary Language:** {FROM_ARTIFACT: data/tech-preferences.md OR ASK_USER: language and version, e.g. TypeScript 5.x}
- **Runtime:** {FROM_ARTIFACT: data/tech-preferences.md OR ASK_USER: runtime and version, e.g. Node.js 20 LTS}

### Framework
- **Backend:** {FROM_ARTIFACT: data/tech-preferences.md OR GENERATE_AND_VALIDATE: based on NFR, e.g. Express 5, Fastify}
- **Frontend:** {FROM_ARTIFACT: data/tech-preferences.md OR GENERATE_AND_VALIDATE: based on NFR, e.g. React 18, Vue 3}

### Database
- **Primary:** {FROM_ARTIFACT: data/tech-preferences.md OR ASK_USER: database, e.g. PostgreSQL 16}
- **ORM/Query Builder:** {GENERATE_AND_VALIDATE: based on chosen stack, e.g. Prisma, Drizzle}
- **Migrations:** {GENERATE_AND_VALIDATE: based on chosen ORM, e.g. Prisma Migrate}

### Testing
- **Unit/Integration:** {GENERATE_AND_VALIDATE: based on stack, e.g. Vitest for TS, pytest for Python}
- **E2E:** {GENERATE_AND_VALIDATE: based on stack, e.g. Playwright}
- **Coverage target:** {FROM_ARTIFACT: docs/prd.md NFR quality OR ASK_USER: percentage, e.g. 80%}

### Tools & Infrastructure
- **Package Manager:** {GENERATE_AND_VALIDATE: based on stack, e.g. pnpm}
- **Bundler:** {GENERATE_AND_VALIDATE: based on stack, e.g. Vite}
- **Linter:** {GENERATE_AND_VALIDATE: based on stack, e.g. ESLint}
- **Formatter:** {GENERATE_AND_VALIDATE: based on stack, e.g. Prettier}
- **CI/CD:** {ASK_USER: CI/CD platform, e.g. GitHub Actions}

## Project Structure

```
{project_name}/
├── {dir1}/                  # {description}
│   ├── {subdir}/            # {description}
│   └── {file}               # {description}
├── {dir2}/                  # {description}
│   ├── {subdir}/            # {description}
│   └── {file}               # {description}
├── docs/                    # Project documentation
├── tests/                   # E2E tests
├── package.json
├── tsconfig.json
└── README.md
```

## Data Models

> RULE: Every entity MUST derive from an FR. Fields with generic type "{type}" are NOT acceptable - specify the exact type (string, number, boolean, Date, enum, etc.)

### Entity: {FROM_ARTIFACT: docs/prd.md FR -> identified entity}

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | {GENERATE_AND_VALIDATE: specific type, e.g. UUID, cuid, autoincrement} | PK, auto-gen | Unique identifier |
| {FROM_ARTIFACT: docs/prd.md FR -> derived field} | {GENERATE_AND_VALIDATE: SPECIFIC type with constraints} | {GENERATE_AND_VALIDATE: constraints, e.g. unique, not null, default} | {GENERATE_AND_VALIDATE: description} |
| createdAt | DateTime | auto | Creation date |
| updatedAt | DateTime | auto | Last update date |

**Relations:**
- {GENERATE_AND_VALIDATE: relation derived from FR, e.g. hasMany Story}

### Entity: {FROM_ARTIFACT: docs/prd.md FR -> identified entity}

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | {GENERATE_AND_VALIDATE: specific type} | PK, auto-gen | Unique identifier |
| {FROM_ARTIFACT: docs/prd.md FR -> derived field} | {GENERATE_AND_VALIDATE: SPECIFIC type} | {GENERATE_AND_VALIDATE: constraints} | {GENERATE_AND_VALIDATE: description} |

**Relations:**
- {GENERATE_AND_VALIDATE: relation derived from FR}

## API Specification

### {GENERATE_AND_VALIDATE: Group derived from Epic/FR}

#### `{GENERATE_AND_VALIDATE: METHOD based on FR action} {GENERATE_AND_VALIDATE: /path based on entity}`
- **Description:** {GENERATE_AND_VALIDATE: what it does, derived from specific FR}
- **Auth:** {GENERATE_AND_VALIDATE: required | public, based on NFR security}
- **Request Body:**
  ```json
  {GENERATE_AND_VALIDATE: fields with SPECIFIC types derived from Data Models}
  ```
- **Response 200:**
  ```json
  {GENERATE_AND_VALIDATE: fields with SPECIFIC types derived from Data Models}
  ```
- **Error Codes:** {GENERATE_AND_VALIDATE: specific codes, e.g. 400 validation, 404 not found, 409 conflict}
- **FR Reference:** FR-{FROM_ARTIFACT: docs/prd.md corresponding FR-ID}

## Component Architecture

{GENERATE_AND_VALIDATE: component hierarchy derived from FR with UI and PRD User Flows. Include ONLY if project has frontend.}

```
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── MainContent
├── Pages
│   ├── {Page1}
│   │   ├── {Component1}
│   │   └── {Component2}
│   └── {Page2}
└── Shared
    ├── {SharedComponent1}
    └── {SharedComponent2}
```

### State Management
- **Approach:** {e.g. Context API, Redux, Zustand, Jotai}
- **Pattern:** {e.g. local state for UI, context for auth, server state with React Query}

## Testing Strategy

### Test Levels

| Level | Framework | What it tests | Coverage target |
|-------|-----------|---------------|-----------------|
| Unit | {framework} | Isolated logic, utilities | {%} |
| Integration | {framework} | Component/module interaction | {%} |
| E2E | {framework} | Complete user flows | Critical paths |

### Naming Convention
- Test files: `{name}.test.{ext}` or `{name}.spec.{ext}`
- Describe: module/component name
- It: expected behavior in natural language

### Patterns
- **Arrange-Act-Assert** for unit tests
- **Given-When-Then** for integration/E2E (aligned with story AC)

## Coding Standards

### Naming
- **Files:** {e.g. kebab-case for files, PascalCase for components}
- **Variables:** {e.g. camelCase}
- **Constants:** {e.g. UPPER_SNAKE_CASE}
- **Types/Interfaces:** {e.g. PascalCase, prefix I for interfaces or not}

### Mandatory Patterns
- {pattern 1: e.g. Error handling with Result type}
- {pattern 2: e.g. Repository pattern for data access}
- {pattern 3: e.g. Named exports, no default export for utilities}

### Forbidden Anti-Patterns
- {anti-pattern 1: e.g. any without justifying comment}
- {anti-pattern 2: e.g. console.log in production code}
- {anti-pattern 3: e.g. inline styles in React}

## FR Coverage Map

> RULE: ALL FR from the PRD MUST appear here. If an FR has no component -> the architecture is incomplete.

| FR | Component/Module | Notes |
|----|------------------|-------|
| FR-001 | {GENERATE_AND_VALIDATE: specific path, e.g. packages/backend/src/routes/users.ts} | {GENERATE_AND_VALIDATE: notes} |
| FR-002 | {GENERATE_AND_VALIDATE: specific path} | {GENERATE_AND_VALIDATE: notes} |
| FR-003 | {GENERATE_AND_VALIDATE: specific path} | {GENERATE_AND_VALIDATE: notes} |

---

_Generated by project-startup pipeline - Step 3: Architecture_
