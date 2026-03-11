# Feature: CustomerSelector Component

## Context
- Main customer selection interface for the Customer Intelligence Dashboard
- Container component that renders a grid of `CustomerCard` components
- Used by business analysts to quickly find and select a customer for deeper inspection
- Must handle 100+ customers efficiently without degrading performance

## Requirements

### Functional Requirements
- Display a list of customer cards, each showing name, company, and health score
- Search and filter customers by name or company (case-insensitive, real-time)
- Track and visually highlight the currently selected customer
- Persist selection state across page interactions (e.g., navigating tabs, re-renders)
- Pass selected customer to parent or shared state for use in other dashboard panels

### User Interface Requirements
- Search input at the top of the panel with placeholder text (e.g., "Search by name or company…")
- Responsive grid layout: single column on mobile, multi-column on wider viewports
- Selected `CustomerCard` visually distinguished (e.g., highlighted border or background)
- Empty state message when no customers match the search query
- Scrollable list/grid when the number of visible cards exceeds the viewport

### Data Requirements
- Sources customer data from `src/data/mock-customers.ts` (`mockCustomers` array)
- Uses the `Customer` interface: `id`, `name`, `company`, `healthScore`, `domains?`
- Filters applied client-side against `name` and `company` fields
- Selection tracked by customer `id`

### Integration Requirements
- Renders `CustomerCard` components for each visible customer
- Passes `customer` and `onClick` props to each `CustomerCard`
- Exposes selected customer to parent via `onSelect` callback prop or shared state
- Properly typed TypeScript interfaces throughout

## Constraints

### Technical Stack
- Next.js 15 (App Router)
- React 19 with TypeScript (strict mode)
- Tailwind CSS for all styling — no inline styles or CSS modules
- No third-party UI library dependencies

### Performance Requirements
- Must remain responsive with 100+ customer records
- Debounce or efficiently handle search input changes (no perceptible lag)
- Avoid unnecessary re-renders of unaffected `CustomerCard` instances (use `React.memo` on cards)
- No layout shift during filtering or selection

### Design Constraints
- Responsive breakpoints: mobile (320px+), tablet (768px+), desktop (1024px+)
- Search input full-width within the panel
- Grid: 1 column (mobile), 2 columns (tablet), 3+ columns (desktop)
- Consistent spacing using Tailwind spacing scale

### File Structure and Naming
- Component file: `components/CustomerSelector.tsx`
- Props interface: `CustomerSelectorProps` exported from component file
- Follow project naming conventions (PascalCase for components)

### Security Considerations
- Treat search input as plain text — do not render it as HTML
- No sensitive customer data exposed in client-side logs
- Proper TypeScript types to prevent unexpected data shapes

## Acceptance Criteria

- [ ] Renders a card for every customer in `mockCustomers` on initial load
- [ ] Search input filters cards in real time by customer name (case-insensitive)
- [ ] Search input filters cards in real time by company name (case-insensitive)
- [ ] Empty state message shown when no customers match the search query
- [ ] Clicking a customer card marks it as selected with a distinct visual style
- [ ] Selection persists when the search query is changed or cleared
- [ ] `onSelect` callback (or equivalent) is called with the selected `Customer` object
- [ ] Responsive grid layout works on mobile (320px+), tablet (768px+), and desktop (1024px+)
- [ ] Performs without perceptible lag with 100+ customer records
- [ ] `CustomerSelectorProps` TypeScript interface is exported from `components/CustomerSelector.tsx`
- [ ] Passes TypeScript strict mode checks
- [ ] No console errors or warnings
- [ ] Follows project code style and conventions
