# TASK-01-01 — Scaffold Next.js + TypeScript + Tailwind + lint/format

> Epic: EPIC-01 · Priority: P0 · Est: S · Depends on: —
> PRD: §15 (stack assumption), §24 · Docs: [architecture §1–2](../../product/01-architecture.md)

## Objective

Create the runnable project skeleton with the fixed stack and strict tooling so
all later work has a consistent base.

## Implementation steps

1. Initialize a Next.js App Router app with TypeScript in the repo root
   (alongside existing `Nugget_PRD.md`, `docs/`, `README.md`).
2. Enable strict TS in `tsconfig.json`: `strict: true`,
   `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`; set the `@/*`
   path alias to `src/*`.
3. Add Tailwind CSS configured for `darkMode: 'class'` and content globs over
   `src/**`.
4. Create the `src/` tree from architecture §2 (empty `index.ts` barrels or
   `.gitkeep` where needed): `app/`, `components/`, `features/`, `hooks/`,
   `lib/{db,repositories,services,providers,validation,privacy}/`, `types/`,
   `test/{fixtures,helpers}/`.
5. Add ESLint (`next/core-web-vitals`, `@typescript-eslint`) + Prettier; add an
   import-boundary lint note (components must not import `lib/db`) as a comment
   rule for reviewers (enforced fully in 01-06 if a plugin is added).
6. Add npm scripts: `dev`, `build`, `start`, `lint`, `format`, `typecheck`.
7. Create a root layout with `<html lang="en">`, base `<body>` and a placeholder
   home page that renders "Nugget".

## Files to create / modify

- `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`,
  `postcss.config.mjs`, `.eslintrc.*`, `.prettierrc`, `.gitignore`
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- `src/` folder skeleton

## Acceptance criteria

- `npm run dev` serves a page rendering "Nugget".
- `npm run build`, `npm run lint`, `npm run typecheck` all succeed with zero errors.
- `@/` alias resolves; strict flags are on.
- `.gitignore` excludes `node_modules`, `.next`, coverage, env files.

## Out of scope

Theme tokens (01-02), routes/nav (01-03), PWA (01-04/05), tests (01-06).
</content>
