# Step 1: Init + Worktree Setup

## GOAL

Initialize pipeline in an isolated worktree.

## CONTEXT LOADING

```yaml
load: [CLAUDE.md, _bmad/bmm/config.yaml]
skip: [packages/*/CONTEXT.md] # Lazy, loaded later
```

## EXECUTION

### 1. Resolve parameters

```
story_id: $ARGUMENTS (e.g. "7.10")
epic_num: part before the dot
story_num: part after the dot
```

If missing, ask the user.

### 2. Verify/Create worktree

```bash
# Check if already in worktree
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" == story/* ]]; then
  echo "Already in worktree: $CURRENT_BRANCH"
else
  # Create worktree via SFT API (fallback to direct git if SFT not active)
  curl -s -X POST http://localhost:5321/api/worktrees \
    -H "Content-Type: application/json" \
    -d "{\"storyId\": \"$STORY_ID\", \"branchName\": \"story/story-$STORY_ID\", \"repoPath\": \"$(pwd)\"}" \
    || git worktree add "../story-${STORY_ID}" -b "story/story-${STORY_ID}"
fi
```

### 3. Check existing state

```bash
STATE_FILE="docs/sprint-artifacts/pipeline-state-${STORY_ID}.yaml"
if [ -f "$STATE_FILE" ]; then
  CURRENT_STEP=$(grep "currentStep:" "$STATE_FILE" | awk '{print $2}')
  echo "Resume from step $CURRENT_STEP"
fi
```

### 4. Check handoff and story file

```bash
# Check if a handoff exists (from another agent/pipeline)
HANDOFF_FILE="docs/sprint-artifacts/handoff-${STORY_ID}.md"
if [ -f "$HANDOFF_FILE" ]; then
  echo "Handoff found: $HANDOFF_FILE → Step 7 (Implement)"
  NEXT_STEP=7
else
  # Check if story file already exists
  STORY_FILE=$(ls docs/stories/${EPIC_NUM}.${STORY_NUM}.*.story.md 2>/dev/null | head -1)
  if [ -n "$STORY_FILE" ]; then
    echo "Story exists: $STORY_FILE → Step 4 (Validate)"
    NEXT_STEP=4
  else
    echo "Story missing → Step 2 (Brief)"
    NEXT_STEP=2
  fi
fi
```

### 5. Create/Update state file

```yaml
# Write to docs/sprint-artifacts/pipeline-state-{story_id}.yaml
story_id: '{story_id}'
status: 'in_progress'
currentStep: { NEXT_STEP }
completedSteps: []
lastTaskCompleted: 'init'
worktree: true
started_at: '{timestamp}'
timestamp: '{timestamp}'
```

### 6. Update STATE.md (centralized)

```bash
# Update docs/sprint-artifacts/STATE.md
cat > docs/sprint-artifacts/STATE.md << EOF
# Pipeline State

## Current Story

**Story:** ${STORY_ID}
**Step:** ${NEXT_STEP}
**Status:** in_progress

## Progress

\`\`\`
[█         ] 10%
\`\`\`

## Session

- **Last activity:** $(date -Iseconds)
- **Resume from:** step ${NEXT_STEP}

---
*Auto-updated by story-pipeline*
EOF
```

## ROUTING

| Condition        | Next Step             |
| ---------------- | --------------------- |
| Handoff found    | 7 (Implement)         |
| State resume     | currentStep from file |
| Story exists     | 4 (Validate)          |
| Story missing    | 2 (Brief)             |

## OUTPUT

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PIPELINE INIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Story:     {story_id}
Worktree:  story/story-{story_id}
Next:      Step {n}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

→ Load step-0{NEXT_STEP}-\*.md and execute.

## FORBIDDEN ANTI-PATTERNS

- Do not start implementation without an isolated worktree (never work on main)
- Do not ignore previous state (pipeline-state.yaml) without asking the user
- Do not skip handoff check - there may be work already done by another agent
- Do not create worktree if branch story/* already exists without verifying it is the same

## CONTEXT CHECK (Rule 6)

If session context exceeds 50%:
1. **DO NOT interrupt** - save state to `docs/sprint-artifacts/pipeline-state-{story_id}.yaml`
2. Write HANDOFF with: current step, completed steps, next action
3. The conversation will be auto-compacted. After compaction, RE-READ state file + current step and resume
