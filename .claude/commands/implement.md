Implement the component described in the spec file: $ARGUMENTS

## Steps

### 1. Read the Spec

Read the spec file provided. Extract:
- **Component name** from the `## Feature:` heading (e.g., `CustomerCard`)
- **Output path** from the Constraints → File Structure section (e.g., `components/CustomerCard.tsx`)
- **All acceptance criteria** as a checklist to verify against
- **Props interface** name and shape from the Data / Props Requirements section
- **Constraints** (tech stack, performance, design, security)

### 2. Explore Existing Code

Before writing anything, read the codebase to understand conventions:
- Check if the output file already exists — if so, read it
- Read 1-2 sibling components in the same directory to match style and patterns
- Check `src/data/mock-customers.ts` (or whichever data file the spec references) to confirm type definitions

### 3. Implement the Component

Generate the component at the path specified in the spec's Constraints section.

Rules:
- Use TypeScript strict mode
- Use Tailwind CSS for all styling — no inline styles, no CSS modules
- Export the component as a named export
- Export the Props interface from the same file
- Follow the props interface exactly as defined in the spec
- Do not add features, props, or behaviors not in the spec
- Render all user-provided strings as plain text — no `dangerouslySetInnerHTML`

### 4. Verify Against Acceptance Criteria

Go through every acceptance criterion from the spec one by one. For each:
- State whether the implementation satisfies it
- If not, note what is missing

Format the verification as:

---
## Acceptance Criteria Verification

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | [criterion text] | ✅ Pass / ❌ Fail | ... |
| 2 | ... | ... | ... |

**Result: PASS / FAIL**
---

### 5. Iterate Until All Criteria Pass

If any criterion fails:
- Fix the implementation immediately
- Re-verify the failed criterion
- Repeat until all criteria show ✅ Pass

Do not stop until the Result is **PASS**.

### 6. Confirm

Once all criteria pass, report:
- The output file path
- A one-line summary of what was implemented
- Any assumptions made that were not explicit in the spec
