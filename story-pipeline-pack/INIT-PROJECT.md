# Story Pipeline Project Initialization

Run this file with Claude to initialize the project.

## 1. CREATE DIRECTORY STRUCTURE

```bash
mkdir -p docs/stories
mkdir -p docs/sprint-artifacts
mkdir -p .claude/plans
mkdir -p .claude/commands
mkdir -p packages/backend/src/__tests__
mkdir -p packages/frontend/src/__tests__
mkdir -p packages/shared/src/__tests__
mkdir -p e2e
```

## 2. CREATE CLAUDE.md

Create the `CLAUDE.md` file in the project root:

```markdown
# [PROJECT_NAME]

## Overview

[Brief description - 1-2 sentences]

## Stack

- Frontend: [e.g. React 18 + Vite + Tailwind]
- Backend: [e.g. Express + Prisma + PostgreSQL]
- Test: [e.g. Vitest + Playwright]

## Commands

- `npm run dev` - development server
- `npm run build` - production build
- `npm run test:unit` - unit tests
- `npm run test:integration` - integration tests
- `npm run test:e2e` - end-to-end tests
- `npm run typecheck` - type checking
- `npm run lint` - linting

## Conventions

### Git

- Branch: `story/{epic}.{story}`
- Commit: `feat|fix|chore(scope): description`

### Test

- TDD: test BEFORE code
- Minimum coverage: 80%

### Code

- TypeScript strict mode
- No `any` without justification

## Pipeline

Use `/story-pipeline {story-id}` to develop.
```

## 3. CREATE CLAUDE SETTINGS

Create `.claude/settings.json`:

```json
{
  "hooks": {
    "pre-commit": {
      "command": "npm run typecheck && npm run lint && npm run test:unit -- --run"
    }
  },
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(git *)",
      "Read(**/*)",
      "Write(src/**/*)",
      "Write(docs/**/*)",
      "Write(packages/**/*)"
    ],
    "deny": ["Bash(rm -rf *)", "Write(.env*)"]
  }
}
```

## 4. PACKAGE.JSON SCRIPTS

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "test": "vitest",
    "test:unit": "vitest --project unit",
    "test:integration": "vitest --project integration",
    "test:e2e": "playwright test"
  }
}
```

## 5. VITEST CONFIG

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      { name: 'unit', include: ['**/*.unit.spec.ts'] },
      { name: 'integration', include: ['**/*.integration.spec.ts'] },
    ],
  },
});
```

## 6. GITIGNORE

```
node_modules/
dist/
.env
*.log
coverage/
docs/sprint-artifacts/*.yaml
```

## 7. VERIFY

```bash
ls -la docs/stories/
ls -la .claude/commands/
npm run typecheck
npm run lint
```

## CHECKLIST

- [ ] Directories created
- [ ] CLAUDE.md created
- [ ] .claude/settings.json configured
- [ ] package.json has test scripts
- [ ] vitest.config.ts present
- [ ] .gitignore updated

**Ready for `/story-pipeline`!**
