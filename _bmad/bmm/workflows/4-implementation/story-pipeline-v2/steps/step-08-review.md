# Step 8: Code Review

## GOAL

Adversarial code review. MUST find at least 3 issues.

## CONTEXT LOADING

```yaml
load: [diff and test output only]
skip: [CONTEXT.md, unmodified files]
```

## EXECUTION

### 1. Get diff

```bash
git diff origin/main..HEAD --stat
git diff origin/main..HEAD
```

### 2. Critical review

Search in EVERY modified file:

- Logic bugs
- Pattern violations
- Missing error handling
- Security issues
- Performance problems
- Missing tests
- Duplicated code

**RULE: Find AT LEAST 3 real issues. NO "looks good".**

### 3. Task verification (MANDATORY)

**For EVERY `[x]` task in the story, you MUST find evidence in the code:**

```bash
STORY_FILE=$(ls docs/stories/${EPIC_NUM}.${STORY_NUM}.*.story.md | head -1)

# Extract all tasks marked [x]
grep -E "^\s*- \[x\]" "$STORY_FILE" | while read task; do
  echo "Verifying: $task"

  # Extract keyword from task
  KEYWORD=$(echo "$task" | sed 's/.*\[x\] //' | cut -d' ' -f1-3)

  # Search for evidence in code
  EVIDENCE=$(grep -rn "$KEYWORD" packages/ 2>/dev/null | head -3)

  if [ -z "$EVIDENCE" ]; then
    echo "WARNING: FALSE POSITIVE: $task - no evidence in code!"
  else
    echo "OK Evidence found: $EVIDENCE"
  fi
done
```

**If task marked [x] but no evidence:**

1. It is a FALSE POSITIVE
2. Go back to the story file
3. Change `[x]` to `[ ]`
4. Implement the task in step 7
5. Retry review

### 4. Fix all issues

For each issue:

1. Describe it
2. Fix in code
3. Verify fix

### 5. Gate review

```bash
#!/bin/bash
set -e

echo "=== GATE: CODE REVIEW ==="

STORY_FILE=$(ls docs/stories/${EPIC_NUM}.${STORY_NUM}.*.story.md | head -1)
REVIEW_FILE="docs/sprint-artifacts/review-${STORY_ID}.md"

# 1. Re-run tests after fix
echo "Running tests..."
npm test -- --run || { echo "GATE FAIL: Tests failing"; exit 1; }
echo "OK Tests pass"

# 2. Re-run lint
echo "Running lint..."
npm run lint || { echo "GATE FAIL: Lint errors"; exit 1; }
echo "OK Lint pass"

# 3. No false positives (task [x] with Deferred/TODO/SKIP)
echo "Checking for false positives..."
if grep -E "^\s*- \[x\].*([Dd]eferred|TODO|SKIP|WIP|N/A)" "$STORY_FILE"; then
  echo "GATE FAIL: Task marked [x] but contains Deferred/TODO/SKIP"
  exit 1
fi
echo "OK No false positives in task markers"

# 4. Verify evidence for each [x] task
echo "Verifying task evidence..."
FALSE_POSITIVES=0
while read task; do
  # Simple check: at least one recent commit mentions this task
  TASK_NUM=$(echo "$task" | grep -oE "Task [0-9]+\.[0-9]+" || echo "")
  if [ -n "$TASK_NUM" ]; then
    if ! git log --oneline -20 | grep -qi "$TASK_NUM"; then
      echo "WARNING: No commit found for: $task"
      FALSE_POSITIVES=$((FALSE_POSITIVES + 1))
    fi
  fi
done < <(grep -E "^\s*- \[x\]" "$STORY_FILE")
if [ "$FALSE_POSITIVES" -gt 0 ]; then
  echo "GATE FAIL: $FALSE_POSITIVES tasks without commit evidence"
  exit 1
fi
echo "OK All tasks have commit evidence"

# 5. Review file exists with at least 3 issues
echo "Checking review issues..."
[ -f "$REVIEW_FILE" ] || { echo "GATE FAIL: Review file missing"; exit 1; }
ISSUE_COUNT=$(grep -c "^### Issue" "$REVIEW_FILE" 2>/dev/null || echo 0)
[ "$ISSUE_COUNT" -ge 3 ] || { echo "GATE FAIL: Found only $ISSUE_COUNT issues, need 3+"; exit 1; }
echo "OK $ISSUE_COUNT issues documented"

# 6. All issues resolved
OPEN_COUNT=$(grep -c "Status: OPEN\|Status: PENDING" "$REVIEW_FILE" 2>/dev/null || echo 0)
[ "$OPEN_COUNT" -eq 0 ] || { echo "GATE FAIL: $OPEN_COUNT issues still open"; exit 1; }
echo "OK All issues resolved"

echo "=== GATE PASS: CODE REVIEW ==="
```

## 6. Context Maintenance (CLAUDE.md + config.yaml)

After code review, verify and update operational context files to maintain coherence.

### 6.1: Verify CLAUDE.md Shards

For every **new directory** created during the story:

```bash
# Find new directories missing CLAUDE.md
NEW_DIRS=$(git diff --name-only origin/main..HEAD | xargs -I{} dirname {} | sort -u)
for dir in $NEW_DIRS; do
  # If it's a significant top-level directory (not docs/, not node_modules/)
  if [ -d "$dir" ] && [ ! -f "$dir/CLAUDE.md" ] && [[ ! "$dir" =~ ^(node_modules|dist|.git|docs) ]]; then
    echo "WARN: $dir has no CLAUDE.md shard"
  fi
done
```

If shards are missing for significant directories, **create** the CLAUDE.md shard following this pattern:

```markdown
# {directory_name}

## Role
{Description of this directory's role in the project}

## Pattern
{Specific patterns used, inferred from newly written code}

## Key Files
{Key files created/modified in this story}

_See root CLAUDE.md for global rules_
```

### 6.2: Update Root CLAUDE.md (if needed)

If the story introduced:
- **New commands** (scripts in package.json) -> update `## Commands` section
- **New structural directories** -> update `## Structure` section
- **New core dependencies** (not devDependencies) -> update `## Stack` section
- **New conventions** emerged during coding -> update `## Conventions` section

```bash
# Check if package.json scripts changed
git diff origin/main..HEAD -- package.json | grep -E '^\+.*"(dev|build|test|lint|typecheck)"' && echo "ACTION: Update ## Commands in CLAUDE.md"

# Check for new structural directories
git diff --name-only origin/main..HEAD | cut -d/ -f1 | sort -u | while read dir; do
  if [ -d "$dir" ] && ! grep -q "$dir/" CLAUDE.md 2>/dev/null; then
    echo "ACTION: Add $dir/ to ## Structure section in CLAUDE.md"
  fi
done
```

### 6.3: Verify config.yaml (if needed)

If the story moved/renamed doc artifacts:

```bash
# Verify config.yaml paths point to existing files
CONFIG="_bmad/bmm/config.yaml"
if [ -f "$CONFIG" ]; then
  PRD=$(grep "prdFile:" "$CONFIG" | awk '{print $2}')
  ARCH=$(grep "architectureFile:" "$CONFIG" | awk '{print $2}')
  [ -f "$PRD" ] || echo "WARN: config.yaml prdFile points to $PRD which does not exist"
  [ -f "$ARCH" ] || echo "WARN: config.yaml architectureFile points to $ARCH which does not exist"
fi
```

If a path is broken, **update config.yaml** with the correct path.

---

## MANDATORY CHECKLIST (DO NOT SKIP)

Before proceeding to step 9, you MUST have completed ALL of these:

```
[] Got complete diff (git diff origin/main..HEAD)
[] Found at least 3 REAL issues in code
[] For EVERY [x] task in story: found evidence in code
[] If false positives found: changed [x] to [ ] and re-implemented
[] All issues fixed and re-verified
[] npm test -- --run PASSES after fixes
[] npm run lint PASSES after fixes
[] CLAUDE.md shards verified for new directories
[] config.yaml paths verified
[] Root CLAUDE.md updated if needed (new commands, structure, stack)
[] Review file written in docs/sprint-artifacts/review-{story_id}.md
[] Ran gate review - PASSES
```

**If even ONE of these is not done -> DO NOT proceed.**

## CREATE VERIFICATION.md

After the gate, create `docs/sprint-artifacts/story-{id}-VERIFICATION.md`:

```markdown
---
story_id: '{story_id}'
verified: '{timestamp}'
status: complete
---

# Verification Report

## Observable Truths

| #   | Truth              | Status   | Evidence           |
| --- | ------------------ | -------- | ------------------ |
| 1   | User can do X      | VERIFIED | Test AC-1 passes   |
| 2   | System validates Y | VERIFIED | Line 42 in file.ts |

## Artifacts

| File                 | Status  | Lines |
| -------------------- | ------- | ----- |
| path/to/file.ts      | CREATED | 120   |
| path/to/test.spec.ts | CREATED | 80    |

## Key Links

| From         | To         | Status |
| ------------ | ---------- | ------ |
| component.ts | service.ts | WIRED  |
```

---

## OUTPUT

```
Issues found: {count}
Issues resolved: {count}
False positives: 0
VERIFICATION.md created
-> Step 9
```

## FORBIDDEN ANTI-PATTERNS

- Do not declare "review ok" without finding at least 3 real issues
- Do not accept [x] tasks without code evidence (false positive)
- Do not skip CLAUDE.md shard verification for new directories
- Do not ignore config.yaml with broken paths
- Do not review only the diff without checking integration with existing code

## CONTEXT CHECK (Rule 6)

If session context exceeds 50%:
1. **DO NOT interrupt** - save state in `docs/sprint-artifacts/pipeline-state-{story_id}.yaml`
2. Write HANDOFF with: current step, completed steps, next action
3. The conversation will be auto-compressed. After compaction, RE-READ state file + current step and resume
