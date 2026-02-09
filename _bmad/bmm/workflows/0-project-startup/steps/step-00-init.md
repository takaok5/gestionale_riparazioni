# Step 0: Init

## Goal
Detect mode (greenfield/brownfield), verify state, create state file.

## Context Load
- PIPELINE-RULES.md
- workflow.yaml

## Task

### Task 0.1: Determine Mode

The `$ARGUMENTS` parameter passed to the command contains the mode:
- `greenfield` = new project from scratch
- `brownfield` = existing project to document

If `$ARGUMENTS` is empty or invalid:
```
AskUserQuestion({
  questions: [{
    question: "What type of project is this?",
    header: "Mode",
    options: [
      { label: "Greenfield", description: "New project from scratch, empty directory" },
      { label: "Brownfield", description: "Existing project with code to document" }
    ],
    multiSelect: false
  }]
})
```

### Task 0.2: Verify Preconditions

**Greenfield:**
1. Check current directory
2. If directory contains significant files (not just .git, .gitignore, README.md):
   - WARNING: "Directory not empty. Are you sure you want to proceed in greenfield mode?"
   - If user confirms, proceed
   - If not, suggest brownfield

**Brownfield:**
1. Verify the directory contains code
2. Look for at least one of: `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle`
3. If none found:
   - ERROR: "No project file found. Verify you are in the correct directory."
   - STOP

### Task 0.3: Check Resume

1. Look for `startup-state.yaml` in the current directory
2. If it exists:
   - Read the file
   - Show the user the current state
   ```
   AskUserQuestion({
     questions: [{
       question: "Found previous state (Step {N}). Do you want to resume?",
       header: "Resume",
       options: [
         { label: "Resume", description: "Continue from Step {N} (last completed)" },
         { label: "Restart", description: "Delete state and start over" }
       ],
       multiSelect: false
     }]
   })
   ```
   - If resume: route to step `currentStep`
   - If restart: delete state file, proceed normally

### Task 0.4: Create State File

Create `startup-state.yaml`:

```yaml
pipeline: project-startup
version: 1.0.0
mode: {greenfield|brownfield}
project_name: "{current directory name}"
created: "{ISO timestamp}"
updated: "{ISO timestamp}"
currentStep: 1
completedSteps:
  - step: 0
    completed: "{ISO timestamp}"
artifacts:
  projectBrief: null
  codebaseAnalysis: null
  prd: null
  architecture: null
  frontendSpec: null
  epicDetails: null
  validationReport: null
  claudeMdRoot: null
  configYaml: null
frontendSpecStatus: pending
```

### Task 0.5: Create Directory docs

```bash
mkdir -p docs
```

## CONTEXT CHECK (Rule 12)

If session context exceeds 50%:
1. **DO NOT interrupt** - save state in `startup-state.yaml`
2. Write HANDOFF with: current step, completed steps, next action
3. The conversation will be auto-compressed. After compact, RE-READ `startup-state.yaml` + current step and resume

## Gate: gate-state-exists

Verify:
1. `startup-state.yaml` exists
2. Field `mode` is set (`greenfield` or `brownfield`)
3. Field `currentStep` = 1

```bash
# Verify file exists
test -f startup-state.yaml || exit 1

# Verify mode is set (handles YAML quoted values)
grep -qE "mode:[[:space:]]*['\"]?(greenfield|brownfield)" startup-state.yaml || exit 1

# Verify currentStep is set to 1
grep -q "currentStep: 1" startup-state.yaml || exit 1
```

## FORBIDDEN ANTI-PATTERNS

- Do not create state file with empty or fabricated mode
- Do not skip precondition checks (brownfield without package.json/requirements.txt)
- Do not ignore previous state (startup-state.yaml) without asking the user
- Do not proceed if greenfield directory is not empty without user confirmation

## Routing

After gate passed:
- Read and execute: `steps/step-01-discovery.md`
