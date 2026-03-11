Verify the component at: $ARGUMENTS

Run a structured verification across four areas and produce a pass/fail summary with specific issues.

## Steps

### 1. Read the Component

Read the component file at the provided path. Identify:
- The component name (PascalCase)
- The exported Props interface name
- All props accepted
- All external imports

### 2. Find the Matching Spec

Look for the component's spec at `specs/[kebab-case-name]-spec.md` (e.g., `CustomerCard` → `specs/customer-card-spec.md`).
- If found, read it and extract all acceptance criteria checkboxes
- If not found, note this and proceed with the remaining checks only

### 3. TypeScript Verification

Run the type checker:
```
npx tsc --noEmit
```

Also run the linter:
```
npm run lint
```

Check the component source for these issues statically:
- Props interface is exported from the component file
- All props are typed (no implicit `any`)
- Optional props use `?` correctly
- No type assertions (`as`) that bypass safety unless clearly justified
- Imports reference types that exist in the imported modules
- `React.memo` or similar wrappers preserve the correct generic type

Report every compiler error or lint warning that names this file.

### 4. Mock Data Compatibility

Read `src/data/mock-customers.ts` and verify:
- The component's props interface is compatible with the `Customer` type
  - Required props on the component map to fields that exist on `Customer`
  - Optional props use fields that are optional on `Customer` (e.g., `domains?`)
- Test compatibility against representative mock data records covering:
  - A customer with a **high** health score (71–100): e.g., John Smith (85)
  - A customer with a **moderate** health score (31–70): e.g., David Wilson (60)
  - A customer with a **low** health score (0–30): e.g., Michael Brown (15)
  - A customer with **multiple domains**: e.g., Michael Brown (3 domains)
  - A customer with a **single domain**: e.g., Sarah Johnson (1 domain)
  - A customer where `domains` is present but you simulate it being **undefined/empty** (edge case)

For each test case, trace through the component logic and confirm:
- The correct health color class is applied
- Domain count is shown only when multiple domains exist
- No crash path exists when `domains` is undefined

### 5. Responsive Design Audit

Inspect every Tailwind class in the component and verify:

**Mobile (320px+)**
- No fixed widths wider than the viewport
- Text doesn't overflow or clip unreadably (look for `truncate`, `overflow-hidden`, or `flex-wrap`)
- Touch targets are reasonably sized (min ~44px height for interactive elements)

**Tablet (768px+)**
- `sm:` or `md:` prefixed classes are used where the spec requires different tablet layout
- Multi-column or expanded layouts activate at the right breakpoint

**Desktop (1024px+)**
- `lg:` prefixed classes apply any desktop-specific adjustments
- Max-width constraints (`max-w-*`) keep the component from over-stretching

**General**
- No hardcoded pixel values in Tailwind classes (prefer spacing scale)
- No inline `style` attributes used for layout or sizing
- Dark mode classes (`dark:`) are present if the component uses light-mode colour classes

### 6. Spec Acceptance Criteria Check

If a spec was found in Step 2, go through each `- [ ]` acceptance criterion and verify it against the implementation. For each criterion, inspect the component source to confirm it is satisfied.

### 7. Output: Pass/Fail Summary

Respond with this report:

---
## Verification Report: [ComponentName]

### TypeScript & Lint
| Check | Status | Detail |
|-------|--------|--------|
| `tsc --noEmit` | ✅ Pass / ❌ Fail | errors or "no errors" |
| ESLint | ✅ Pass / ❌ Fail | warnings/errors or "clean" |
| Props interface exported | ✅ / ❌ | |
| No implicit `any` | ✅ / ❌ | |

### Mock Data Compatibility
| Test Case | Status | Detail |
|-----------|--------|--------|
| High health score (85 – John Smith) | ✅ / ❌ | |
| Moderate health score (60 – David Wilson) | ✅ / ❌ | |
| Low health score (15 – Michael Brown) | ✅ / ❌ | |
| Multiple domains (3 – Michael Brown) | ✅ / ❌ | |
| Single domain (Sarah Johnson) | ✅ / ❌ | |
| Undefined/empty domains (edge case) | ✅ / ❌ | |

### Responsive Design
| Breakpoint | Status | Detail |
|------------|--------|--------|
| Mobile (320px+) | ✅ / ⚠️ / ❌ | |
| Tablet (768px+) | ✅ / ⚠️ / ❌ | |
| Desktop (1024px+) | ✅ / ⚠️ / ❌ | |
| Dark mode | ✅ / ⚠️ / ❌ | |

### Acceptance Criteria
| # | Criterion | Status | Detail |
|---|-----------|--------|--------|
| 1 | [criterion] | ✅ / ❌ | |
| … | … | … | |

---
### Overall Result: ✅ PASS / ❌ FAIL

**Issues to fix:**
List each failure with the exact line or class causing it and a specific fix.

**Warnings:**
List any ⚠️ items that are not blocking but worth addressing.
---

Legend: ✅ Pass | ⚠️ Warning | ❌ Fail
