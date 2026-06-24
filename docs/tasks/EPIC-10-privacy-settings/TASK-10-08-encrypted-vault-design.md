# TASK-10-08 — Encrypted vault design (design only)

> Epic: EPIC-10 · Priority: P1 (design) · Est: S · Depends on: —
> PRD: FR-803, §15, R-006, Q4 · Docs: [product spec §3 Q4](../../product/00-product-spec.md)

## Objective

Produce a scoped threat model and design for an optional encrypted vault /
app-lock, **without** implementing encryption in the MVP (Post-V1 build).

## Implementation steps

1. Write `docs/design/encrypted-vault.md` covering: threat model (what it does/
   doesn't protect against; R-006 false-confidence caveat), key derivation
   (passphrase → key via WebCrypto/PBKDF2/Argon2-wasm), what is encrypted
   (Blobs + sensitive text vs metadata/index trade-offs), lock/unlock UX, and
   recovery/data-loss risks.
2. Reserve the settings flag `encryptionEnabled` (already in schema) and document
   migration implications.
3. Explicitly mark implementation as out of MVP scope.

## Files to create / modify

- `docs/design/encrypted-vault.md`

## Acceptance criteria

- A design doc exists with threat model, key handling, scope, UX, and risks.
- It clearly states encryption is not implemented in the MVP.

## Out of scope

Any encryption implementation (Post-V1).
</content>
