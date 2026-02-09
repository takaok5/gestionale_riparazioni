# Step 7: Scaffold + Shard

## Goal
Create project structure, CLAUDE.md shards, shard large documents, integrate story-pipeline.

## Context Load
- `docs/architecture.md` (Project Structure, Tech Stack, Coding Standards)
- `templates/scaffold.tmpl.yaml` (scaffold configuration)
- `templates/claude-md.tmpl.md` (CLAUDE.md root + shard template)
- All artifacts (for sharding)

---

## Sub-Step 7a: Project Scaffold

### Greenfield

#### Task 7a.1: Read Project Structure and Scaffold Config

1. Read `docs/architecture.md` section "## Project Structure" to get the directory tree.
2. Read `_bmad/bmm/workflows/0-project-startup/templates/scaffold.tmpl.yaml` as reference for scaffold configuration (directories, config files, git setup).

#### Task 7a.2: Create Directory Structure

For each directory defined in the architecture:
```bash
mkdir -p {directory}
```

#### Task 7a.3: Create Base Files

Based on `docs/architecture.md` section Tech Stack:

1. **package.json** (if Node.js):
   ```json
   {
     "name": "{project_name}",
     "version": "0.1.0",
     "private": true,
     "scripts": {
       "dev": "{from architecture}",
       "build": "{from architecture}",
       "test": "{from architecture}",
       "typecheck": "{from architecture}",
       "lint": "{from architecture}"
     }
   }
   ```

2. **tsconfig.json** (if TypeScript): Strict configuration based on architecture

3. **.gitignore**: Standard for the chosen stack

4. **.prettierrc**: From Coding Standards in architecture

5. **Test config** (vitest.config.ts / jest.config.ts): From Testing Strategy

6. **README.md**: Generated from project-brief (Vision + Commands + Getting Started)

#### Task 7a.4: Git Init

```bash
git init
# Add specific files (do not use -A to avoid sensitive files like .env)
git add docs/ CLAUDE.md package.json tsconfig.json .gitignore .prettierrc README.md
git commit -m "chore: initial project scaffold"
```

### Brownfield

#### Task 7a.5: Check Missing Files

1. Compare documented architecture with existing files
2. Create ONLY missing files (DO NOT overwrite existing ones):
   - `.prettierrc` if missing
   - `.gitignore` if missing
   - Test config if missing
3. If git not initialized:
   ```bash
   git init
   # Add specific files (DO NOT use git add -A to avoid .env, credentials)
   git add docs/ CLAUDE.md .gitignore .prettierrc *.json *.ts *.config.*
   git commit -m "chore: add missing project configs"
   ```

#### CHECKPOINT 1/2 (after Project Scaffold)

Before proceeding to CLAUDE.md shards, verify:
- All directories defined in architecture.md exist
- package.json (or equivalent) has correct scripts (dev, build, test, typecheck, lint)
- .gitignore covers sensitive files for the chosen stack
- If greenfield: git init done with initial commit
- If context exceeds 50% → save state and write HANDOFF before proceeding

---

## Sub-Step 7b: CLAUDE.md Shards

### Task 7b.1: Create CLAUDE.md Root

Read `_bmad/bmm/workflows/0-project-startup/templates/claude-md.tmpl.md` as reference for structure and sections.

Write `CLAUDE.md` in the project root with:

```markdown
# {project_name}

## Stack
{From docs/architecture.md section Tech Stack}

## Commands
{From package.json scripts or equivalent}

## Structure
{From docs/architecture.md section Project Structure - condensed version}

## Conventions
{From docs/architecture.md section Coding Standards}
```

### Task 7b.2: Create Shard per Main Directory

For each main directory defined in Project Structure:

Write `{dir}/CLAUDE.md`:

```markdown
# {directory_name}

## Role
{From architecture: directory description}

## Pattern
{Patterns specific to this directory, inferred from architecture and coding standards}

## Key Files
{Key files in this directory}

## Anti-Pattern
{What NOT to do, inferred from Coding Standards}

_See root CLAUDE.md for global rules_
```

#### CHECKPOINT 2/2 (after CLAUDE.md Shards)

Before proceeding to document sharding, verify:
- CLAUDE.md root has sections Stack, Commands, Structure, Conventions
- At least 1 CLAUDE.md shard in a main subdirectory
- Each shard has sections Role, Pattern, Key Files, Anti-Pattern
- If context exceeds 50% → save state and write HANDOFF before proceeding

---

## Sub-Step 7c: Shard Large Documents

### Task 7c.1: Check Sizes

```bash
wc -l docs/prd.md docs/architecture.md docs/epic-details.md
```

### Task 7c.2: Shard PRD (if > 300 lines)

If `docs/prd.md` exceeds 300 lines:

1. Create `docs/epics/` directory
2. For each Epic in the PRD:
   - Create `docs/epics/epic-{n}-{slug}.md` with the epic content
3. Keep `docs/prd.md` as an index with links to sharded epics

### Task 7c.3: Shard Architecture (if > 300 lines)

If `docs/architecture.md` exceeds 300 lines:

1. Create `docs/architecture/` directory
2. For each main section:
   - Create `docs/architecture/{section-slug}.md`
3. Keep `docs/architecture.md` as an index

### Task 7c.4: Shard Epic Details (ALWAYS)

`docs/epic-details.md` is ALWAYS sharded:

1. Create `docs/epics/` directory (if it doesn't already exist)
2. For each Epic:
   - Create `docs/epics/epic-{n}-{slug}.md` with all stories for that epic
3. Keep `docs/epic-details.md` as an index with links

---

## Sub-Step 7d: Story Pipeline Integration

### Task 7d.1: Copy Story Pipeline Files

Check if story-pipeline-pack is available. If so:

1. Copy `.claude/commands/story-pipeline.md` into the project
2. Copy `_bmad/bmm/workflows/4-implementation/story-pipeline-v2/` into the project

If story-pipeline-pack is not available:
- Notify the user that manual installation is required
- Create placeholder `.claude/commands/story-pipeline.md` with instructions

### Task 7d.2: Create config.yaml

Write `_bmad/bmm/config.yaml` (path expected by story-pipeline-v2):

```bash
mkdir -p _bmad/bmm
```

```yaml
# Story Pipeline Configuration
# Generated by project-startup pipeline

prd:
  prdFile: docs/prd.md
  prdSharded: {true if sharded in 7c.2}
  prdShardedLocation: docs/epics

architecture:
  architectureFile: docs/architecture.md
  architectureSharded: {true if sharded in 7c.3}
  architectureShardedLocation: docs/architecture

# Paths expected by story-pipeline-v2 (workflow.yaml: output_folder, sprint_artifacts)
output_folder: docs/stories
sprint_artifacts: docs/sprint-artifacts
```

### Task 7d.3: Create Story Pipeline Directories

```bash
mkdir -p docs/stories
mkdir -p docs/sprint-artifacts
```

### Task 7d.4: Final Commit

```bash
# Add specific generated files (do not use -A to avoid sensitive files)
git add docs/ CLAUDE.md _bmad/ .claude/ .gitignore
git commit -m "chore: project startup complete, ready for story pipeline"
```

---

## MANDATORY CHECKLIST (DO NOT SKIP)

Before declaring the pipeline complete, you MUST have done ALL of these:

```
□ Directory structure created from architecture.md
□ package.json (or equivalent) with dev/build/test/typecheck/lint scripts
□ Config files created (.gitignore, .prettierrc, tsconfig.json, test config)
□ CLAUDE.md root with sections Stack, Commands, Structure, Conventions
□ At least 1 CLAUDE.md shard in a main subdirectory
□ epic-details.md sharded into docs/epics/
□ config.yaml created with valid paths
□ .claude/commands/story-pipeline.md present
□ docs/stories/ and docs/sprint-artifacts/ created
□ Initial git commit done
□ No empty files in docs/
□ Gate script executed - PASSES
```

**If even ONE is unchecked -> DO NOT proceed.**

## Update State

```yaml
pipeline: project-startup
version: 1.0.0
mode: {mode}
project_name: "{name}"
created: "{original timestamp}"
updated: "{timestamp}"
currentStep: completed
completedSteps:
  - step: 0
    completed: "..."
  - step: 1
    completed: "..."
    artifact: docs/project-brief.md
  - step: 2
    completed: "..."
    artifact: docs/prd.md
  - step: 3
    completed: "..."
    artifact: docs/architecture.md
  - step: 4
    completed: "..."
    artifact: docs/frontend-spec.md
  - step: 5
    completed: "..."
    artifact: docs/epic-details.md
  - step: 6
    completed: "..."
    artifact: docs/validation-report.md
  - step: 7
    completed: "{timestamp}"
    artifact: CLAUDE.md + config.yaml
artifacts:
  projectBrief: docs/project-brief.md
  prd: docs/prd.md
  architecture: docs/architecture.md
  frontendSpec: docs/frontend-spec.md  # or null
  epicDetails: docs/epic-details.md
  validationReport: docs/validation-report.md
  claudeMdRoot: CLAUDE.md
  configYaml: _bmad/bmm/config.yaml
frontendSpecStatus: completed  # or skipped
```

## CONTEXT CHECK (Rule 12)

If session context exceeds 50%:
1. **DO NOT interrupt** - save state in `startup-state.yaml`
2. Write HANDOFF with: current step, completed steps, next action
3. The conversation will be auto-compressed. After compact, RE-READ `startup-state.yaml` + current step and resume

## Gate: gate-scaffold-complete

```bash
# CLAUDE.md root exists and has content
test -f CLAUDE.md || exit 1
grep -q "## Stack" CLAUDE.md || exit 1
grep -q "## Commands" CLAUDE.md || exit 1
grep -q "## Structure" CLAUDE.md || exit 1

# At least 1 CLAUDE.md shard in subdirectory
SHARD_COUNT=$(find . -mindepth 2 -name "CLAUDE.md" | head -5 | wc -l)
[ "$SHARD_COUNT" -ge 1 ] || { echo "FAIL: no CLAUDE.md shard found"; exit 1; }

# docs/epics/ contains at least 1 epic file
EPIC_FILES=$(ls docs/epics/epic-*.md 2>/dev/null | wc -l)
[ "$EPIC_FILES" -ge 1 ] || { echo "FAIL: no epic file in docs/epics/"; exit 1; }

# config.yaml exists with correct paths (in _bmad/bmm/ for story-pipeline-v2)
test -f _bmad/bmm/config.yaml || exit 1
grep -q "prdFile" _bmad/bmm/config.yaml || exit 1
grep -q "architectureFile" _bmad/bmm/config.yaml || exit 1

# .claude/commands/story-pipeline.md exists
test -f .claude/commands/story-pipeline.md || { echo "FAIL: story-pipeline.md not found"; exit 1; }

# git log shows at least 1 commit
git log --oneline -1 > /dev/null 2>&1 || { echo "FAIL: no git commit"; exit 1; }

# No empty generated files
EMPTY_FILES=$(find docs/ -empty -name "*.md" | head -5 | wc -l)
[ "$EMPTY_FILES" -eq 0 ] || { echo "FAIL: empty files found in docs/"; exit 1; }

echo "Gate passed"
```

## FORBIDDEN ANTI-PATTERNS

- Do not create empty "placeholder" files - every file must have valid content
- Do not use `git add -A` or `git add .` - add only specific files
- Do not copy identical CLAUDE.md shards for every directory - each shard must be specific
- Do not skip sharding epic-details.md - it is ALWAYS required
- Do not create config.yaml with paths that don't exist - verify first

## Final Message

After gate passed:

```
PIPELINE COMPLETE!

Generated artifacts:
- docs/project-brief.md (or codebase-analysis.md)
- docs/prd.md
- docs/architecture.md
- docs/frontend-spec.md (if applicable)
- docs/epic-details.md + docs/epics/
- docs/validation-report.md
- CLAUDE.md + shards
- _bmad/bmm/config.yaml

Next step:
  /story-pipeline 1.1

To start with the first story of the first epic.
```
