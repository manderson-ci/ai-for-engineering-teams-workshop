# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking (tsc --noEmit)
```

## Custom Slash Commands

This repo has four custom slash commands in `.claude/commands/`:

- `/spec [ComponentName]` — Generate a spec from requirements in `/requirements/`, saves to `/specs/[kebab-case]-spec.md`
- `/spec-review [path]` — Validate a spec file against the required template sections
- `/implement [spec-path]` — Implement a component from a spec, iterating until all acceptance criteria pass
- `/verify [component-path]` — Run a 7-point verification suite (TypeScript, lint, spec criteria, mock data, responsive, props, imports)

## Architecture

**Next.js 15 App Router** app with TypeScript strict mode and Tailwind CSS v4.

- `src/app/` — Pages and root layout (App Router). `page.tsx` is a client component (`'use client'`).
- `src/components/` — React components. Use `React.memo` for list items. Export both the component and its props interface.
- `src/data/` — Mock data only. `mock-customers.ts` exports the `Customer` interface and `mockCustomers` array. `mock-market-intelligence.ts` exports generators for headlines and sentiment.

**Path alias:** `@/*` maps to `./src/*`

## Health Score Convention

Customer health scores (0–100) map to: red = 0–30, yellow = 31–70, green = 71–100. This logic lives in `CustomerCard.tsx` and should be consistent across any new components that display health scores.

## Workshop Context

This is a spec-driven development workshop. The workflow is:

1. Requirements live in `/requirements/`
2. Specs are generated into `/specs/` using `/spec`
3. Components are implemented using `/implement [spec-path]`
4. Verified using `/verify [component-path]`

The `templates/spec-template.md` defines the required spec structure (Feature, Context, Requirements, Constraints, Acceptance Criteria).
