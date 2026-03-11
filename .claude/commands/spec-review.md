Review the spec file at: $ARGUMENTS

Validate it against @templates/spec-template.md and provide structured feedback.

## Validation Steps

1. **Read the spec file** at the provided path
2. **Check for required top-level feature heading**: `## Feature: [name]` (not a placeholder)
3. **Validate each required section** exists and is substantive:

### Section Checklist

For each required section, check:
- Does the section heading exist? (`### Context`, `### Requirements`, `### Constraints`, `### Acceptance Criteria`)
- Does it have actual content (not just the template placeholder text)?
- Is the content specific to the feature (not generic copy-paste)?

**Context section** must address:
- [ ] Purpose and role in the application
- [ ] How it fits into the larger system
- [ ] Who will use it and when

**Requirements section** must address:
- [ ] Functional requirements (what it must do)
- [ ] User interface requirements
- [ ] Data requirements
- [ ] Integration requirements

**Constraints section** must address:
- [ ] Technical stack specifics
- [ ] Performance requirements
- [ ] Design constraints
- [ ] File structure / naming conventions
- [ ] Props interface / TypeScript definitions
- [ ] Security considerations

**Acceptance Criteria section** must:
- [ ] Have at least one checkbox item (`- [ ]`)
- [ ] Include testable criteria (not vague)
- [ ] Cover edge cases
- [ ] Address user experience
- [ ] Verify integration points

## Output Format

Respond with a structured report in this format:

---
## Spec Review: [filename]

### Overall Status: [PASS / NEEDS WORK / FAIL]

### Section Validation
| Section | Status | Notes |
|---------|--------|-------|
| Feature Heading | ✅/❌ | ... |
| Context | ✅/⚠️/❌ | ... |
| Requirements | ✅/⚠️/❌ | ... |
| Constraints | ✅/⚠️/❌ | ... |
| Acceptance Criteria | ✅/⚠️/❌ | ... |

Legend: ✅ Complete | ⚠️ Incomplete | ❌ Missing

### Issues Found
List each issue with:
- **Section**: which section has the problem
- **Issue**: what is missing or incomplete
- **Fix**: specific, actionable guidance on what to add

### Strengths
What is done well in this spec.

### Summary
One paragraph summarizing the spec quality and top 1-3 priorities to address.
---

Be specific and actionable. Reference exact content from the spec when pointing out issues.
