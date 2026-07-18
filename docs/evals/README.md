# Nugget canonical extraction evaluation

The canonical suite protects the MVP behavior that turns a ramble into zero, one, or several grounded ideas. The fixture set is intentionally checked in at `src/lib/evals/fixtures/canonical.json`; do not tune expected counts or categories to accommodate a model regression.

## What is scored

The deterministic scorer measures fixture-level idea-boundary accuracy and ordered category accuracy. The expected category order follows segmentation candidate order, even if the organization response returns its objects in another array order. The MVP gates are:

- at least 90% exact idea-count accuracy;
- at least 85% exact ordered-category accuracy;
- zero category IDs outside the supplied category set; and
- zero normalization-equivalent forbidden claims labeled as explicit.

It also checks the fixture-specific requirements: `research-needed` must set `research.needed` to `true`, every goal derived for `implied-goal` must use `basis: "inferred"`, and `duplicate-actions` must not contain suggested actions that collapse to the same normalized action. Duplicate-action comparison first removes trivial presentation differences. For the canonical pantry fixture only, it also treats actions with the same `create:spreadsheet` action-head/object signature as duplicates even when one mentions fields or a `simple` modifier. The diagnostic preserves both original texts, the comparison key, and whether equality or the scoped signature matched; unrelated actions such as measuring shelves remain distinct.

Forbidden-claim matching normalizes case, punctuation, apostrophes, and whitespace. It catches normalization-equivalent wording; it is not a semantic-paraphrase detector. Structured grounding validation and human review of the saved live payload remain necessary for differently worded unsupported claims.

Run the deterministic scoring tests with:

```powershell
npx vitest run src/lib/evals/scoring.test.ts
```

These tests use no provider and are included in the normal `npm test` and CI runs. They do not constitute a live model score.

## Live GPT-5.6 Terra run

The live suite directly uses the production `resolveLlmConfig`, `createOpenAIModelClient`, prompt builders, structured-output schemas, span normalization, and grounding validator. It does not call an application route or substitute a mock client. Fixtures run sequentially. Each of the 12 fixtures makes one segmentation request followed by one organization request, including the expected zero-idea fixture, for 24 GPT-5.6 requests total.

The suite refuses to run unless all of these conditions hold:

- `OPENAI_API_KEY` is present in the process environment;
- neither `NUGGET_LLM_API_KEY` nor `NUGGET_TRANSCRIPTION_API_KEY` contains a value, so production key precedence cannot silently bill a different credential;
- the resolved base URL is exactly `https://api.openai.com/v1`;
- the resolved model is exactly `gpt-5.6-terra`; and
- reasoning effort is `medium`.

Set `OPENAI_API_KEY` through the developer's local secret manager or current shell without writing it to a file, then run:

```powershell
npm run eval:live
Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue
```

The authorized key is non-enumerable in the preflight result: client construction can read it, but JSON serialization omits it. Each fixture also owns a 170-second abort deadline, shorter than its 180-second Vitest timeout, and clears that deadline in `finally`; a timed-out request cannot continue into the next sequential fixture.

The live suite is deliberately excluded from normal tests and CI. A completed run writes `docs/evals/latest.json` with public configuration metadata, raw structured results, per-fixture diagnostics, and the aggregate score. It never serializes the API key. Rerun it after any prompt, schema, model, reasoning-effort, or category-description change.

## July 16 deferral and July 17 canonical result

The overnight build did not run the live suite. At the configured per-fixture output ceilings, 12 fixtures can request up to `12 * (1,800 + 4,000) = 69,600` output tokens. At the supplied GPT-5.6 Sol output rate of $30 per million tokens, output alone could cost $2.088 before input tokens, which exceeds the approximately $2 overnight authorization. Pricing and actual token use can change, so verify the current estimate before authorizing a future run.

Accordingly, the July 16 overnight run was deferred. This was a historical
cost/authorization decision, not a relaxation of the fixtures, structured
schemas, grounding rules, or score thresholds.

On July 17, the authorized canonical v2 run completed and wrote
[`latest.json`](latest.json) at `2026-07-17T18:23:10.007Z`. It used
`gpt-5.6-terra` with medium reasoning, `segment-v2`, and `organize-v2`. All 12
fixtures passed idea-count and ordered-category checks; invalid category IDs and
unsupported explicit claims were both zero; every fixture-specific requirement
passed; and every result retains both provider response IDs. The initial v1
failure remains in Git history at `be48e46`; the v2 prompt fix is `8d5d380`.

The Sprint 2 quality/evaluation gate is therefore complete. This report does
not establish physical-device behavior, PWA install/background behavior, or any
submission outcome. Rerun it after a prompt, schema, model, reasoning-effort,
or category-description change; do not weaken the canonical fixtures or their
thresholds to preserve a passing result.
