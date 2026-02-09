# Step 9: Final Commit

## GOAL

Final commit after all gates passed.

## CONTEXT LOADING

```yaml
load: [] # Git only, no context needed
```

## EXECUTION

### 1. Final verification

```bash
npm run typecheck || exit 1
npm run lint || exit 1
npm run build || exit 1
npm test -- --run || exit 1
```

### 2. Verify updated context

Before staging, verify that operational context files are consistent:

```bash
# Root CLAUDE.md updated (check Structure section vs actual directories)
if [ -f CLAUDE.md ]; then
  echo "✓ Root CLAUDE.md exists"
else
  echo "⚠ Root CLAUDE.md missing — create before committing"
  exit 1
fi

# config.yaml intact
CONFIG="_bmad/bmm/config.yaml"
if [ -f "$CONFIG" ]; then
  PRD=$(grep "prdFile:" "$CONFIG" | awk '{print $2}')
  ARCH=$(grep "architectureFile:" "$CONFIG" | awk '{print $2}')
  [ -f "$PRD" ] || { echo "⚠ config.yaml: $PRD does not exist"; exit 1; }
  [ -f "$ARCH" ] || { echo "⚠ config.yaml: $ARCH does not exist"; exit 1; }
  echo "✓ config.yaml paths valid"
fi
```

### 3. Stage files

> **RULE:** NEVER use `git add -A` or `git add .`. Add ONLY specific files to avoid committing secrets or temporary files.

```bash
# Add specific files (DO NOT use git add -A to avoid .env, credentials, etc.)
git add packages/ docs/ CLAUDE.md _bmad/ .claude/ package.json tsconfig.json *.config.* .gitignore .prettierrc
git status
```

### 4. Commit

```bash
STORY_TITLE=$(head -1 docs/stories/*.story.md | grep title | cut -d: -f2 | xargs)

git commit -m "$(cat <<EOF
feat(${STORY_ID}): ${STORY_TITLE}

- Implemented all acceptance criteria
- All tests passing
- Code review completed

Story: ${STORY_ID}
EOF
)"
```

### 5. Pre-merge gate

```bash
# Correct branch
BRANCH=$(git branch --show-current)
[[ "$BRANCH" == story/* ]] || exit 1

# Clean working tree
git diff --quiet || exit 1
git diff --cached --quiet || exit 1

# Valid commit message
LAST_MSG=$(git log -1 --format=%s)
echo "$LAST_MSG" | grep -qE "^(feat|fix|chore)" || exit 1

# No secrets (pattern standardized with step-10)
git diff HEAD~1 | grep -iE "(password|secret|api[._]?key|token|credential).*=.*['\"]" && exit 1

echo "GATE PASS: Ready for merge"
```

## MANDATORY CHECKLIST (DO NOT SKIP)

Before proceeding to step 10, you MUST have completed ALL of these:

```
□ npm run typecheck - PASSES
□ npm run lint - PASSES
□ npm run build - PASSES
□ npm test -- --run - PASSES (ALL tests)
□ Root CLAUDE.md exists and Structure section is consistent
□ config.yaml paths valid (PRD, architecture exist)
□ Updated context verified
□ git add with SPECIFIC files (NOT git add -A)
□ Commit with message format "feat/fix/chore({story_id}): {title}"
□ NO secrets in diff (password, api_key, token, credential)
□ Clean working tree after commit
□ Pre-merge gate - PASSES
```

**If even ONE of these is not done -> DO NOT proceed.**

## CREATE SUMMARY.md

After commit, create `docs/sprint-artifacts/story-{id}-SUMMARY.md`:

```markdown
---
story_id: '{story_id}'
completed: '{timestamp}'
duration: '{total_time}'
---

# Story {story_id} Summary

## Stats

- Files created: {n}
- Files modified: {n}
- Lines added: {n}
- Tests added: {n}
- Commits: {n}

## Decisions Made

- Chose X for reason Y
- ...

## Deviations from Plan

- (None / Description)

## Issues Encountered

- (None / Description and how resolved)

## Lessons Learned

- ...
```

---

## OUTPUT

```
Commit: {sha}
Message: feat({story_id}): {title}
SUMMARY.md created
→ Step 10
```

## FORBIDDEN ANTI-PATTERNS

- Do not use `git add -A` or `git add .` - add only specific files
- Do not commit without running typecheck + lint + build + test
- Do not commit files with secrets (password, api_key, token, credential)
- Do not create commits with generic messages ("update") - use conventional format
- Do not skip SUMMARY.md - document decisions and deviations from plan

## CONTEXT CHECK (Rule 6)

If session context exceeds 50%:
1. **DO NOT interrupt** - save state to `docs/sprint-artifacts/pipeline-state-{story_id}.yaml`
2. Write HANDOFF with: current step, completed steps, next action
3. Conversation will be auto-compressed. After compaction, RE-READ state file + current step and resume
