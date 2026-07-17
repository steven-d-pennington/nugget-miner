# Nugget screenshot plan

These are the five primary Devpost UI assets. They were captured from the current local production build with synthetic safe data, not from a provider call or private user content. The first four use a `390 x 844` CSS viewport at device scale factor 2, producing `780 x 1688` PNGs. The complete idea detail is intentionally a full-page capture at the same width so the required goal, blocker, research need, and suggested action are simultaneously visible and legible in one truthful current-UI image.

| Order | Asset | State and visible evidence | Capture data | Dimensions | Bytes | SHA-256 |
|---:|---|---|---|---:|---:|---|
| 1 | `01-capture-idle.png` | Mobile Capture idle state, record control, local-save/cloud-processing disclosure, and bottom navigation. | Empty local browser state. | 780 x 1688 | 144733 | `BDD167AAC831C310505B043CAE24FC316BA196F439B3A8FF065ACB9C70510BD1` |
| 2 | `02-recording-saved-processing.png` | Recording saved and the Saved → Transcribing → Organizing → Ready for review timeline. | Synthetic microphone tone; no provider call. | 780 x 1688 | 122203 | `FB509FAE94FD83D292105D8A7E023F3235C1F2596A86E8C514720A724A6522D1` |
| 3 | `03-three-ideas-review.png` | Review screen with **3 ideas found**, confirmation controls, an editable idea, provenance, and source-capture control. | Deterministic three-idea fixture and mocked provider routes. | 780 x 1688 | 124133 | `0330436ACEF5A8784DCEE07BE7C56AFB605E8095459F43BC1EDD9CAC1E276DC1` |
| 4 | `04-ideas-library.png` | Ideas library with a `community` search, Personal category filter, and tag filters. | Clearly labeled local sample library. | 780 x 1688 | 110979 | `D5665BFF7F7851279894B18F2F25BEC392B69D262C9919B7F1E4C86302BE7DC8` |
| 5 | `05-idea-detail.png` | Complete sample idea detail: title, goal, blocker, suggested action, research-needed assessment, linked action, and source drawer. | Clearly labeled local sample library. | 780 x 9184 | 505052 | `F44A2687C6158C765F3650BE01B316EA0FAA134B8734867DE0BF7DA4235DA917` |

## Capture and acceptance method

The ignored capture automation was run with:

```powershell
npx playwright test --config .superpowers/sdd/playwright.submission-assets.config.ts .superpowers/sdd/sprint-6-task-3.capture.spec.ts
```

The suite resets the Nugget IndexedDB database before each state. It uses fake microphone input for the recording-saved screen, deterministic mocked routes for the three-idea review, and the shipped local sample loader for library/detail. The full-page detail capture asserts the populated values below before it writes the PNG:

- Goal: `Test whether ten nearby households would participate.`
- Blocker: `Need a simple way to track availability and responsibility.`
- Research assessment: `Compare lightweight inventory and lending tools.`
- Suggested action: `Draft a one-page interest survey.`

The five filenames, sizes, dimensions, and SHA-256 hashes were programmatically checked after capture. The SHA-256 values are distinct. Each image was visually inspected for legibility, warm ivory/navy/amber consistency, truthful local/cloud wording, safe synthetic content, and absence of browser secrets.

## Devpost placement and update rule

Use the assets in the table order. They demonstrate the capture-to-review-to-library flow without substituting an architecture diagram for product UI. Before final Devpost upload, recapture the same states from the public account-free production build and compare the images against the deployed UI. Do not add a sixth architecture asset unless Devpost allows it and all five UI screenshots remain present.

The current verified preview is Vercel-auth protected, so these images are submission preparation evidence rather than proof of a public judging path. See [Devpost submission draft](DEVPOST_SUBMISSION.md), [Judge Test Path](JUDGING_TEST_PATH.md), and the [Build Week evidence ledger](BUILD_WEEK_EVIDENCE.md).
