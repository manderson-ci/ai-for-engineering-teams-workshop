# Feature: Button Component

## Context
- Reusable button component for the Customer Intelligence Dashboard
- Used throughout the dashboard for primary user actions (form submissions, confirmations, destructive actions)
- Part of the design system to ensure UI consistency across all views
- Consumed by business analysts and admin users interacting with the dashboard

## Requirements

### Functional Requirements
- Accept `label`, `onClick`, and `variant` props
- Support three variants: `primary`, `secondary`, `danger`
- Include a loading state that displays a spinner and disables interaction
- Trigger `onClick` handler on click when not loading or disabled
- Support optional `disabled` prop to prevent interaction

### User Interface Requirements
- Variant styles:
  - `primary`: solid filled, high-emphasis action (e.g., Save, Confirm)
  - `secondary`: outlined or muted, lower-emphasis action (e.g., Cancel, Back)
  - `danger`: red-toned, destructive action (e.g., Delete, Remove)
- Loading state: replace label with an inline spinner; button remains visually present but non-interactive
- Maximum width: 200px
- Consistent padding, border-radius, and font size using Tailwind CSS utilities
- Visible focus ring for keyboard navigation
- Hover and active states for all variants

### Accessibility Requirements
- Use a native `<button>` element
- `aria-label` prop to override visible label for screen readers when needed
- `aria-disabled="true"` and `disabled` attribute when disabled or loading
- `aria-busy="true"` during loading state
- Spinner has `aria-hidden="true"` so screen readers announce the label, not the spinner

### Data / Props Requirements
- `label`: string — visible button text
- `onClick`: `() => void` — click handler
- `variant`: `"primary" | "secondary" | "danger"` — visual style
- `isLoading?`: boolean — shows spinner, disables interaction (default: `false`)
- `disabled?`: boolean — disables interaction (default: `false`)
- `ariaLabel?`: string — overrides accessible label for screen readers
- `type?`: `"button" | "submit" | "reset"` — HTML button type (default: `"button"`)

### Integration Requirements
- Exported as a named export from `components/Button.tsx`
- `ButtonProps` TypeScript interface exported from the same file
- Usable in any dashboard form, modal, or action panel

## Constraints

### Technical Stack
- React 19 with TypeScript (strict mode)
- Tailwind CSS for all styling — no inline styles or CSS modules
- No third-party UI library dependencies

### Design Constraints
- Maximum width: 200px (`max-w-[200px]`)
- Minimum touch target height: 44px for accessibility
- Consistent spacing using Tailwind spacing scale
- Spinner implemented with a Tailwind CSS `animate-spin` border utility (no external icon library required)

### Performance Requirements
- Lightweight — no unnecessary re-renders
- Use `React.memo` if the component is used in large lists

### File Structure and Naming
- Component file: `components/Button.tsx`
- Props interface: `ButtonProps` exported from component file
- Follow project naming conventions (PascalCase for components)

### Security Considerations
- Do not render `label` as raw HTML — treat as plain text
- No sensitive data passed through button props

## Acceptance Criteria

- [ ] Renders with `primary`, `secondary`, and `danger` variants with distinct visual styles
- [ ] Displays the `label` text correctly
- [ ] Calls `onClick` when clicked in the default (non-loading, non-disabled) state
- [ ] Does not call `onClick` when `isLoading` or `disabled` is `true`
- [ ] Shows a spinner and hides the label text when `isLoading` is `true`
- [ ] Applies `disabled` and `aria-disabled="true"` attributes when disabled or loading
- [ ] Applies `aria-busy="true"` during loading state
- [ ] Respects maximum width of 200px
- [ ] Meets minimum touch target height of 44px
- [ ] Has visible focus ring for keyboard navigation
- [ ] `ButtonProps` TypeScript interface is exported from `components/Button.tsx`
- [ ] Passes TypeScript strict mode checks
- [ ] No console errors or warnings
- [ ] Follows project code style and conventions
