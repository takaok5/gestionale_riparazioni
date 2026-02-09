# PIPELINE RULES - READ ALWAYS

## RULE 1: NO TASK IS OPTIONAL

Every step has MANDATORY tasks. Do not skip any.
If you think about skipping a task -> YOU ARE DOING IT WRONG.

## RULE 2: MINIMAL CONTEXT

DO NOT load files not needed for the current step.

- Step 1-4: Story file only
- Step 5-7: Only CONTEXT.md of dirs you modify
- Step 8-10: Only diff and test output

## RULE 3: PERSISTENT STATE

After EVERY completed task:

1. Update `docs/sprint-artifacts/pipeline-state-{story_id}.yaml`
2. Mark task in story file
3. Incremental commit

## RULE 4: MANDATORY GATE AT STEP END

At the end of EVERY step, run the gate and/or checklist. Do not proceed if it fails.

## RULE 5: OPERATIONAL CONTEXT MAINTENANCE

After every implemented story, context files MUST be updated:

1. **CLAUDE.md root** - if new commands, structural directories, core dependencies or conventions emerge
2. **CLAUDE.md shards** - if significant new directories are created, add the shard
3. **config.yaml** - if artifact doc paths change, update references

Step 8 (Review) checks and updates. Step 9 (Commit) validates before committing.
If a context file is stale or broken -> **BLOCK** until resolved.

## RULE 6: IF CONTEXT BLOATS

1. STOP
2. Save state to pipeline-state.yaml
3. Ask user to restart session
4. On restart, load ONLY:
   - PIPELINE-RULES.md (this file)
   - pipeline-state-{story_id}.yaml
   - Current step
