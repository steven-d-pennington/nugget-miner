# Nugget screenshot plan

These are the five primary Devpost UI assets. They were captured on July 18,
2026 from the public, account-free production origin at
`https://nugget-miner-kappa.vercel.app`, backed by `main` at `e50cd42` and
production deployment `dpl_Hgznv72apf9t5TkCRwzakd6p3Tou`.

The capture used a clean `430 x 932` CSS viewport at device scale factor 2,
producing 860-pixel-wide PNGs. The first three images are one phone viewport.
The library and detail images use a temporarily tall viewport at the same width
so the real persistent navigation renders once at the bottom and every required
field remains readable. No image was composited or retouched.

| Order | Asset | State and visible evidence | Capture data | Dimensions | Bytes | SHA-256 |
|---:|---|---|---|---:|---:|---|
| 1 | `01-capture-idle.png` | Mobile Capture idle state, concave record control, continuous waveform line, local-save disclosure, and three-tab navigation. | Empty clean browser state. | 860 x 1864 | 196084 | `3EAA3FF5AE6D149E57DBCEF5D652DCE4C7EC6BB9A73D219B9341460F1FC5B409` |
| 2 | `02-recording-saved-processing.png` | Recording saved locally, playable source, Saved → Transcribing → Organizing → Ready for review timeline, disclosure, and Process now. | Browser recording UI with a generated safe audio tone; no provider call. | 860 x 1864 | 131635 | `31B0E8B3206C5A342886E3B73927FA54125F3D3C0240A97CB68E03B80C76F60F` |
| 3 | `03-three-ideas-review.png` | **3 ideas found**, idea navigation, confirm-all control, editable title and summary, provenance, source access, and confirmation actions. | Shipped three-idea sample content linked to a deterministic local review run; no provider call. | 860 x 1864 | 140083 | `1B9AFD15FB98433A802AAB1D8180A03745296556FABD72C0E7EC3B526BDF7D33` |
| 4 | `04-ideas-library.png` | Search `community`, Personal category, granular tags, Cards/Compact toggle, and one clearly labeled sample result with blocker, research, and action signals. | Shipped local sample library. | 860 x 2412 | 188618 | `10E4DEFBCF80C8849AB02DE5FF3AC12D1F7E939307298A58DC5C54CB738F13CF` |
| 5 | `05-idea-detail.png` | Summary-first sample detail with category, tags, bold **Why it matters** and **What’s in the way** sections, goal, blocker, question, research resources, next action, linked action, source, and export controls. | Shipped local sample library. | 860 x 3856 | 296278 | `D431F0C61AC53B9A789513626F3803BCF7A70419C5C9F9E197F24AE4AAA6B8E6` |

## Capture and acceptance method

The ignored capture automation was run against public production with:

```powershell
npx playwright test --config .superpowers/sdd/playwright.final-submission.config.ts .superpowers/sdd/final-submission-screenshots.spec.ts
```

The final run passed 1/1. It blocks service workers only in the isolated capture
profile so Playwright route and microphone behavior remain deterministic. It
uses fake microphone input for the saved-recording screen, the shipped local
sample loader for library/detail, and a browser-local succeeded organization
run to display the same three sample ideas in the canonical review UI. It does
not call OpenAI, alter production data, or modify the deployed application.
The ignored helper and config were removed after capture so Vitest cannot
discover a Playwright file during the normal `npm test` gate.

Before accepting the assets, the automation asserted the public production
headings and controls for Capture, Recording saved, Ideas, full idea detail,
and **3 ideas found**. All five PNGs were then opened and visually inspected for
legibility, warm ivory/navy/amber consistency, truthful local/cloud wording,
safe sample content, current navigation, and absence of browser secrets or
obsolete UI.

## Devpost placement

Upload the assets in the table order. They tell the complete product story:
capture, durable local save, review, retrieval, and useful organized detail.
Keep all `Sample` labels visible. Do not describe the deterministic review or
sample records as the result of the just-recorded tone; the separate committed
live evaluation is [`../evals/latest.json`](../evals/latest.json).
