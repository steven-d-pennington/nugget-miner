# EPIC-10 — Privacy & Settings

> Milestone M1 (onboarding/consent) / M5 (route guards, rate limits) · Priority P0
> Features F-1, F-9, F-10
> Product context: [product spec §3, §10](../../product/00-product-spec.md),
> [UX §5–6](../../product/03-ux-guidelines.md)

## Goal

Deliver the trust layer: onboarding, the consent gate before any cloud call, the
privacy indicator + mode labels, the Settings screen (providers, storage,
retention, export/import, reset), a safe nuclear reset, server-route guards, and
the encrypted-vault design (design only).

## Outcome / DoD

- AC-004: cloud processing shows a cancellable consent explanation before upload.
- Settings expose privacy mode, providers, export/import, reset, version.
- API routes validate size/type, sanitize errors, log no content, hold no keys.

## Tasks

| ID | Title | Depends on |
| --- | --- | --- |
| [TASK-10-01](./TASK-10-01-onboarding.md) | Onboarding & privacy primer | EPIC-01 |
| [TASK-10-02](./TASK-10-02-consent-gate.md) | Consent gate service + UI (AC-004) | EPIC-01, EPIC-02 |
| [TASK-10-03](./TASK-10-03-privacy-indicator.md) | Privacy indicator + processing-mode labels | 10-02 |
| [TASK-10-04](./TASK-10-04-settings-screen.md) | Settings screen | EPIC-02 |
| [TASK-10-05](./TASK-10-05-provider-settings.md) | Provider selection settings | 10-04, EPIC-06/07 |
| [TASK-10-06](./TASK-10-06-nuclear-reset.md) | Safe nuclear reset | 10-04 |
| [TASK-10-07](./TASK-10-07-api-route-guards.md) | API route guards (size/type/sanitize/rate-limit) | EPIC-06/07 routes |
| [TASK-10-08](./TASK-10-08-encrypted-vault-design.md) | Encrypted vault design (design only) | — |

## Sequencing

10-01/10-02 early (M1); 10-03 after 10-02; 10-04 → 10-05/10-06; 10-07 with the
cloud routes (M5); 10-08 anytime (doc).
</content>
