# EPIC-10 — Privacy & Settings

> Source: [Nugget PRD](../../Nugget_PRD.md) §7 J5, §8, §9 (Onboarding/privacy; Settings), §13, §15, §18 Milestone 1 & 5, §19
> Status: Not started · Priority: P0 · Milestone: M1 (onboarding/consent), M5 (rate limits/guards)

## Summary

Deliver the privacy and trust layer: first-run onboarding, just-in-time consent
gates before any cloud processing, a privacy status indicator, the Settings
screen (providers, storage, retention, export/import, reset), a safe "nuclear
reset", optional app-lock/encrypted vault design, and the server-side guards for
optional API routes.

## Scope

### Onboarding & privacy (PRD §9)

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-001 | P0 | First-run onboarding explaining local storage, optional processing, privacy defaults. |
| FR-002 | P0 | Defer microphone permission until recording starts (implemented in EPIC-03; surfaced here). |
| FR-003 | P0 | Label processing modes: Local/mock, browser/on-device, cloud/API opt-in. |
| FR-004 | P0 | Before any cloud/API processing, show consent naming the data sent and the purpose. |
| FR-005 | P1 | Privacy status indicator in Settings and on processing screens. |

### Settings & administration (PRD §9)

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-801 | P0 | Settings include privacy mode, provider settings, export, reset, app version. |
| FR-802 | P0 | Safe "nuclear reset" explaining data deletion before clearing local storage. |
| FR-803 | P1 | Optional app lock / passphrase / encrypted vault mode where feasible. |
| FR-804 | P1 | Dev tools for DB health, job queue, sample data (see EPIC-02). |

### Optional API routes (PRD §13, §15 — M5)
- `POST /api/transcribe`, `POST /api/extract`, `GET /api/health`.
- Server must not persist audio/transcript by default; validate payload sizes/types;
  sanitize errors; avoid logging user content; no API keys in client (NFR-002).

## Related PRD requirements

- §15 Privacy rules — local-only default; explicit, contextual, cancellable cloud
  processing; no silent sync/telemetry/background uploads; visibly scoped exports.
- §15 Security rules — no client keys; validate uploads; sanitize errors; CSP +
  dependency hygiene before public beta; scoped encrypted-vault threat model.
- AC-004 — cloud processing shows a consent explanation before upload begins.
- §14 — plain-language privacy copy ("Stored on this device" / "Will be sent for processing").
- NFR-001 Privacy, NFR-002 Security, NFR-010 Cost control (rate-limitable cloud, mock-capable dev).
- R-003 / R-006 (PRD §21) — cloud-trust and false-encryption-confidence mitigations.

## Acceptance criteria

- AC-004: Any provider that would send data to a server shows a consent
  explanation (naming data + purpose) before upload, and is cancellable (FR-004, NFR-001).
- Processing modes are clearly labeled mock / browser / cloud (FR-003).
- Privacy status indicator visible in Settings and on processing screens (FR-005).
- "Nuclear reset" explains consequences and clears local storage on confirm (FR-802).
- Optional API routes validate payload size/type, sanitize errors, never log
  content, and hold no client-side keys (NFR-002).

## Implementation notes

- Consent gate is a shared component invoked by EPIC-06/07 cloud adapters before
  any network call; default app state is local-only (NFR-001).
- `settings` entity (PRD §11) stores privacyMode, processingMode, retentionPolicy,
  encryptionEnabled, providerConfigRef.
- Rate-limit + payload guards on API routes (NFR-010); add CSP + dependency hygiene
  before public beta (§15).
- Position encrypted vault as a separate, explicitly threat-modeled feature (R-006);
  scope design here, defer full build (post-V1 candidate, PRD §6/§22).
- Reset/retention flows coordinate with EPIC-09; never auto-destroy audio without
  configured policy + clear consequence (§14).

## Definition of Done

- Onboarding, labeled processing modes, consent gate, and privacy indicator shipped.
- Settings with provider config, export/import entry, retention, and safe reset.
- Optional API routes (if enabled) enforce size/type validation, error sanitization,
  no content logging, no client keys; AC-004 passes.

## Dependencies

- EPIC-01 (shell), EPIC-02 (`settings`). Gates EPIC-06/EPIC-07 cloud paths.
- Retention/reset interacts with EPIC-04 and EPIC-09.
</content>
