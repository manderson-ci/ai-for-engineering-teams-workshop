# Feature: CustomerCard Component

## Context
- Individual customer display component for the Customer Intelligence Dashboard
- Used within the `CustomerSelector` container component in a grid layout
- Provides at-a-glance customer information for quick identification and health monitoring
- Consumed by business analysts monitoring customer status and domain health

## Requirements

### Functional Requirements
- Display customer name, company name, and health score (0-100)
- Show customer domains (websites) for health monitoring context
- Display domain count when a customer has multiple domains
- Color-coded health indicator based on score:
  - Red (0-30): Poor / critical health
  - Yellow (31-70): Moderate / warning health
  - Green (71-100): Good / healthy
- Clickable card to navigate to or surface a detailed customer profile

### User Interface Requirements
- Card-based visual design with clear typographic hierarchy: name > company > health score > domains
- Health score badge or indicator using the color scale above
- Visible hover state to communicate clickability
- Responsive layout for mobile and desktop viewports

### Data / Props Requirements
- `customer`: `Customer` — customer object from `src/data/mock-customers.ts`
  - `id`: string
  - `name`: string
  - `company`: string
  - `healthScore`: number (0–100)
  - `domains?`: string[] — optional array of website URLs
- `onClick?`: `(customer: Customer) => void` — optional click handler invoked when the card is selected

### Integration Requirements
- Exported as a named export from `components/CustomerCard.tsx`
- `CustomerCardProps` TypeScript interface exported from the same file
- Accepts props-based data flow from `CustomerSelector` parent component
- Imports `Customer` type from `src/data/mock-customers.ts`

## Constraints

### Technical Stack
- Next.js 15 (App Router)
- React 19 with TypeScript (strict mode)
- Tailwind CSS for all styling — no inline styles or CSS modules
- No third-party UI library dependencies

### Performance Requirements
- Fast rendering (< 16ms per card for 60fps)
- Use `React.memo` to prevent unnecessary re-renders when rendered in lists
- No layout shift during load

### Design Constraints
- Responsive breakpoints: mobile (320px+), tablet (768px+), desktop (1024px+)
- Maximum card width: 400px
- Minimum card height: 120px
- Consistent spacing using Tailwind spacing scale

### File Structure and Naming
- Component file: `components/CustomerCard.tsx`
- Props interface: `CustomerCardProps` exported from component file
- Follow project naming conventions (PascalCase for components)

### Security Considerations
- Render `name`, `company`, and domain strings as plain text — do not use `dangerouslySetInnerHTML`
- No sensitive customer data (e.g., email) exposed in client-side logs or rendered unintentionally
- Proper TypeScript types to prevent unexpected data shapes

## Acceptance Criteria

- [ ] Displays customer name, company name, and health score correctly
- [ ] Health score color matches specification: red (0-30), yellow (31-70), green (71-100)
- [ ] Shows all customer domains when `domains` array is present
- [ ] Displays domain count when the customer has multiple domains
- [ ] Renders without errors when `domains` is undefined or empty
- [ ] Card is clickable and calls `onClick` with the customer object when provided
- [ ] Visible hover state indicates clickability
- [ ] Responsive layout works on mobile (320px+), tablet (768px+), and desktop (1024px+)
- [ ] `CustomerCardProps` TypeScript interface is exported from `components/CustomerCard.tsx`
- [ ] Imports and uses `Customer` type from `src/data/mock-customers.ts`
- [ ] Passes TypeScript strict mode checks
- [ ] No console errors or warnings
- [ ] Follows project code style and conventions
