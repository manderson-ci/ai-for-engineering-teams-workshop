Generate a spec for the component: $ARGUMENTS

## Steps

1. **Parse the component name** from the argument (e.g., "CustomerCard" → component name is "CustomerCard", file slug is "customer-card")

2. **Check for requirements file** at `requirements/[kebab-case-name].md`
   - If found, read it and use as primary input for the spec
   - If not found, note that no requirements file exists and generate the spec based on the component name and any contextual knowledge from the codebase

3. **Read the template** at `@templates/spec-template.md` to understand the required structure

4. **Generate a complete spec** following the template structure:

### Feature Heading
Use: `## Feature: [ComponentName]`

### Context Section
- Purpose and role in the application
- How it fits into the larger system
- Who will use it and when

### Requirements Section
- Functional requirements (what it must do)
- User interface requirements
- Data requirements
- Integration requirements

### Constraints Section
- Technical stack: Next.js 15, React 19, TypeScript, Tailwind CSS
- Performance requirements (load times, rendering thresholds)
- Design constraints (responsive breakpoints, component size limits)
- File structure and naming conventions
- Props interface and TypeScript definitions
- Security considerations

### Acceptance Criteria Section
- Testable checkbox items (`- [ ]`)
- Edge cases handled
- User experience validated
- Integration points verified

5. **Save the spec** to `specs/[kebab-case-name]-spec.md`

6. **Confirm** by reporting the output file path and a brief summary of what was generated.

## Notes
- Convert PascalCase component names to kebab-case for file paths (e.g., "CustomerCard" → "customer-card")
- If a spec file already exists at the target path, inform the user and ask before overwriting
- Make all acceptance criteria specific and testable, not vague
