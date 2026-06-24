# TASK-01-06 — Test harness + CI pipeline

> Epic: EPIC-01 · Priority: P0 · Est: M · Depends on: 01-01
> PRD: §20 · Docs: [architecture §7](../../product/01-architecture.md)

## Objective

Establish the testing tools and CI so every later task can add tests and gate
merges. This is the foundation EPIC-11 builds full coverage on.

## Implementation steps

1. Add Vitest + React Testing Library + jsdom; configure `vitest.config.ts` with
   the `@/` alias and a setup file. Add `fake-indexeddb` for repository tests.
2. Add Playwright for e2e/offline tests with a minimal config and one smoke spec
   (app loads, nav works). Include an offline scenario stub for 01-05.
3. Add `axe-core`/`@axe-core/playwright` and one accessibility smoke check on the
   primitives/home page.
4. Add scripts: `test`, `test:watch`, `test:e2e`, `coverage`.
5. Add a CI workflow (`.github/workflows/ci.yml`) running install → `typecheck`
   → `lint` → `test` → `build` on push/PR. Keep e2e as a separate job.
6. (Optional) add an ESLint rule / import-boundary plugin enforcing
   "components must not import `@/lib/db` or `@/lib/repositories`" (architecture §2).

## Files to create / modify

- `vitest.config.ts`, `src/test/helpers/setup.ts`
- `playwright.config.ts`, `e2e/smoke.spec.ts`
- `.github/workflows/ci.yml`
- `package.json` scripts

## Acceptance criteria

- `npm test` runs Vitest green; `npm run test:e2e` runs the smoke spec green.
- An axe check runs against at least one page and passes.
- CI workflow runs typecheck+lint+test+build and fails on any error.
- `fake-indexeddb` is wired so repository tests (EPIC-02) can run headless.

## Out of scope

Full flow/coverage suites (EPIC-11) — only the harness + smoke tests here.
</content>
