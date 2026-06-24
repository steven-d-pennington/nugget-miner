# TASK-10-07 — API route guards (size/type/sanitize/rate-limit)

> Epic: EPIC-10 · Priority: P0 (for any cloud route) · Est: M · Depends on: EPIC-06/07 routes
> PRD: §13, §15, NFR-002, NFR-010 · Docs: [architecture §5–6](../../product/01-architecture.md)

## Objective

Harden the optional server routes so cloud processing is safe by construction.

## Implementation steps

1. Add shared middleware/util `src/app/api/_guards.ts`: payload **size** limit,
   **MIME/type** validation, JSON body validation (Zod), and a simple
   **rate limiter** (per-IP/token; NFR-010).
2. Add `GET /api/health` returning status **without** accepting user content (PRD §13).
3. Ensure every route (`/api/transcribe`, `/api/extract`) uses the guards, reads
   keys only from server env, **does not persist** audio/transcript, and returns
   **sanitized** `{ error: { code, message } }` (no secrets/provider details/content).
4. Add a CSP header + basic security headers in `next.config.mjs` (PRD §15;
   "before public beta").
5. Add tests asserting oversized/wrong-type/over-limit requests are rejected and
   errors are sanitized.

## Files to create / modify

- `src/app/api/_guards.ts`, `src/app/api/health/route.ts`
- update `transcribe`/`extract` routes; `next.config.mjs` (headers/CSP)

## Acceptance criteria

- Oversized/wrong-type/rate-exceeded requests are rejected before processing.
- No keys in client bundles; no audio/transcript persisted or logged server-side.
- Error responses are sanitized; `/api/health` accepts no content.
- CSP/security headers present.

## Out of scope

Provider/business logic (EPIC-06/07).
</content>
