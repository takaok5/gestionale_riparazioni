# BMAD Pipeline Pack

Complete pack for managing the entire software project lifecycle: from conception to delivery.

## Two Pipelines

### Pipeline 0: Project Startup (`/project-startup`)
Generates all pre-story artifacts: project brief, PRD, architecture, frontend spec, epic details, validation report, CLAUDE.md shards.

### Pipeline 4: Story Pipeline v2 (`/story-pipeline`)
Fraud-proof pipeline with 12 anti-error rules for implementing individual stories with blocking gates, TDD, and code review.

## Complete Flow

```
/project-startup greenfield   -->  generates docs/ + config.yaml
                                        |
/story-pipeline 1.1            <--  first story ready
/story-pipeline 1.2            <--  second story
...
```

## Installation

This pack contains two directories that must be copied to your **project root** (where you run `claude`).

**PACK_DIR** = the directory containing this README.md
**PROJECT_ROOT** = your target project root (the directory where Claude is launched)

### What to copy

Only two directories matter:

| Source (in pack) | Destination (in project) | Contents |
|------------------|--------------------------|----------|
| `PACK_DIR/.claude/` | `PROJECT_ROOT/.claude/` | Slash commands (`/project-startup`, `/story-pipeline`) |
| `PACK_DIR/_bmad/` | `PROJECT_ROOT/_bmad/` | Pipeline logic (steps, templates, workflows, data) |

`README.md` and `INIT-PROJECT.md` are pack documentation — do NOT copy them.

### Copy commands

**PowerShell (Windows):**
```powershell
$PACK_DIR = "path\to\this\pack"
$PROJECT_ROOT = "path\to\your\project"

Copy-Item -Path "$PACK_DIR\.claude" -Destination "$PROJECT_ROOT\" -Recurse -Force
Copy-Item -Path "$PACK_DIR\_bmad" -Destination "$PROJECT_ROOT\" -Recurse -Force
```

**Bash (Linux/macOS):**
```bash
PACK_DIR="path/to/this/pack"
PROJECT_ROOT="path/to/your/project"

cp -r "$PACK_DIR/.claude" "$PROJECT_ROOT/"
cp -r "$PACK_DIR/_bmad" "$PROJECT_ROOT/"
```

### Verify installation

After copying, these files MUST exist in your project:

```
PROJECT_ROOT/
├── .claude/
│   └── commands/
│       ├── project-startup.md         # /project-startup greenfield|brownfield
│       └── story-pipeline.md          # /story-pipeline 1.1
└── _bmad/
    └── bmm/
        └── workflows/
            ├── 0-project-startup/     # 8 steps: init -> scaffold
            │   ├── PIPELINE-RULES.md
            │   ├── workflow.yaml
            │   ├── templates/         # 7 template files
            │   ├── data/              # 2 data files
            │   └── steps/             # 8 step files (00-07)
            └── 4-implementation/      # 10 steps: init -> merge
                └── story-pipeline-v2/
                    ├── PIPELINE-RULES.md
                    ├── workflow.yaml
                    └── steps/         # 10 step files (01-10)
```

Quick check:
```bash
# All 4 must exist
test -f .claude/commands/project-startup.md && echo "OK: project-startup command"
test -f .claude/commands/story-pipeline.md && echo "OK: story-pipeline command"
test -f _bmad/bmm/workflows/0-project-startup/workflow.yaml && echo "OK: Pipeline 0"
test -f _bmad/bmm/workflows/4-implementation/story-pipeline-v2/workflow.yaml && echo "OK: Pipeline 4"
```

## Usage

```bash
# PHASE 1: Generate project documentation
claude "/project-startup greenfield"     # New project
claude "/project-startup brownfield"     # Existing project

# PHASE 2: Implement stories one at a time
claude "/story-pipeline 1.1"            # Epic 1, Story 1
claude "/story-pipeline 1.2"            # Epic 1, Story 2
```

## Project Startup - Output

| Step | Name | Output |
|------|------|--------|
| 0 | Init | startup-state.yaml |
| 1 | Discovery | project-brief.md / codebase-analysis.md |
| 2 | PRD | prd.md |
| 3 | Architecture | architecture.md |
| 4 | Frontend Spec | frontend-spec.md (skip if backend-only) |
| 5 | Epic Details | epic-details.md + docs/epics/ |
| 6 | Validation | validation-report.md |
| 7 | Scaffold | CLAUDE.md, config.yaml, project structure |

## Story Pipeline v2 - Output

| Step | Name | Output |
|------|------|--------|
| 1 | Init + Worktree | pipeline-state, branch |
| 2 | Story Brief | story brief (Opus) |
| 3 | Create Story | story file |
| 4 | Validate + Research | RESEARCH.md |
| 5 | ATDD (RED) | failing tests |
| 6 | Plan | plan with YAML frontmatter |
| 7 | Implement (GREEN) | passing tests |
| 8 | Review | VERIFICATION.md |
| 9 | Commit | SUMMARY.md |
| 10 | Merge | merge to main |

## Shared Features

- **Blocking gates:** Every step has checks. If they fail, STOP.
- **Lazy context:** Only files needed for the current step.
- **Persistent state:** Resume from last completed step.
- **Zero lies:** If a gate fails, do not proceed.
- **Interactive elicitation** (project-startup): options menu for every section.
- **Mandatory TDD** (story-pipeline): test before code.
