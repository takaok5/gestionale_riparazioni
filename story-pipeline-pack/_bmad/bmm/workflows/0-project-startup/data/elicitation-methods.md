# Elicitation Methods

## Main Menu (Post-Section)

After every generated section, present to the user via `AskUserQuestion`:

### Option 1: Approve and proceed
- User is satisfied with the section
- Save and move to next section

### Option 2: Divergent brainstorming
- Generate 5 different alternatives for the section
- Present in comparative format
- User picks favorite or requests a mix

### Option 3: Competitor analysis
- Identify 3-5 similar market solutions
- Analyze strengths/weaknesses
- Suggest differentiation

### Option 4: Technical deep dive
- Expand section with implementation details
- Add performance, security, scalability considerations
- Useful for architectural sections

## AskUserQuestion Implementation

```
AskUserQuestion({
  questions: [{
    question: "How do you want to proceed with section '{section_name}'?",
    header: "Elicitation",
    options: [
      { label: "Approve and proceed", description: "Section is complete, move to next" },
      { label: "Brainstorming", description: "Generate 5 divergent alternatives" },
      { label: "Competitor analysis", description: "Compare with existing market solutions" },
      { label: "Technical deep dive", description: "Expand with implementation details and trade-offs" }
    ],
    multiSelect: false
  }]
})
```

## Anti-Loop Rule

- **Max 3 iterations per section**
- After 3 iterations: force approval with warning
- Warning: "Iteration limit reached for this section. Proceeding with current version. You can modify it manually later."

## Post-Elicitation (if option 2/3/4)

After presenting analysis results:

```
AskUserQuestion({
  questions: [{
    question: "Do you want to integrate these results into the section?",
    header: "Integration",
    options: [
      { label: "Integrate all", description: "Merge all results into the section" },
      { label: "Partial integration", description: "Let me choose what to include" },
      { label: "Discard and retry", description: "This analysis is not useful, try a different approach" },
      { label: "Back to menu", description: "Return to main options" }
    ],
    multiSelect: false
  }]
})
```

## Complete Flow per Section

1. Claude generates proposal for the section
2. Presents section summary to user
3. Elicitation menu (4 options)
4. If option 1 -> save, next section
5. If option 2/3/4 -> run analysis -> present results -> integration menu
6. Repeat from step 2 with updated section
7. Max 3 iterations, then force-approve
