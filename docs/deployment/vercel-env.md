# Vercel AI provider environment

Nugget keeps provider credentials on the server. Real transcription sends
audio to the configured transcription endpoint, and real organization sends
transcript text to the configured GPT-5.6 endpoint.

## Required secret

`OPENAI_API_KEY` is the only secret in the shared environment template. Add it
to each Vercel environment that will use real cloud processing:

```powershell
vercel env add OPENAI_API_KEY production
vercel env add OPENAI_API_KEY preview
```

Never place the key in client code, IndexedDB, localStorage, screenshots,
commits, logs, or chat messages.

## Optional overrides

Every remaining key is a non-secret optional override. The values below are the
MVP defaults documented in `.env.example`.

| Key | Purpose | Default |
| --- | --- | --- |
| `OPENAI_BASE_URL` | Shared OpenAI-compatible base URL | `https://api.openai.com/v1` |
| `NUGGET_TRANSCRIPTION_BASE_URL` | Transcription-specific base URL | `https://api.openai.com/v1` |
| `NUGGET_LLM_BASE_URL` | Organization-specific base URL | `https://api.openai.com/v1` |
| `NUGGET_TRANSCRIPTION_MODEL` | Transcription model | `gpt-4o-mini-transcribe` |
| `NUGGET_LLM_MODEL` | Organization model | `gpt-5.6-terra` |
| `NUGGET_LLM_REASONING_EFFORT` | GPT-5.6 reasoning effort | `medium` |
| `NUGGET_TRANSCRIPTION_MAX_BYTES` | Maximum transcription upload size | `26214400` |
| `NUGGET_LLM_MAX_INPUT_CHARS` | Maximum transcript input length | `24000` |
| `NUGGET_TRANSCRIPTION_TIMEOUT_MS` | Transcription request timeout | `60000` |
| `NUGGET_LLM_TIMEOUT_MS` | Organization request timeout | `90000` |

Only add an override in Vercel when the deployment must differ from these
defaults.

## Verified Vercel environment presence — 2026-07-16

`vercel env ls` confirmed these encrypted entries by presence only:

| Key | Confirmed environments |
| --- | --- |
| `OPENAI_API_KEY` | Production, Preview |
| `NUGGET_LLM_MODEL` | Development, Preview, Production |
| `NUGGET_TRANSCRIPTION_MODEL` | Development, Preview, Production |
| `NUGGET_TRANSCRIPTION_API_KEY` | Development, Preview, Production |

The values were not pulled, inspected, printed, or otherwise verified. This is
only an encrypted-entry presence check; it does not change the template
defaults above or authorize use of any value.

## Preview protection note

The verified 2026-07-16 preview is protected by Vercel authentication for
anonymous access. It can support authenticated smoke checks, but it is not a
public judging URL. Do not change Deployment Protection or create a production
deployment without explicit authorization.

## Production AI endpoint rate limiting

The production Vercel Firewall protects only paid AI `POST` routes:

- `/api/transcribe`
- `/api/extract/segment`
- `/api/extract/organize`
- `/api/activate`

The active rule, `Protect Nugget AI endpoints`, uses a 60-request fixed window
over 600 seconds, keyed by both IP address and JA4 fingerprint, and denies
excess requests with HTTP 429. Normal page loads, `/api/health`, and read-only
provider configuration requests do not count toward the limit.

The application-level limiter remains a secondary guard against accidental
client loops. It is not the production abuse boundary because its counters are
process-local. Transcription identifies a valid installed client separately so
multiple judges sharing one network do not consume the same secondary bucket.

## Pull environment values locally

```powershell
vercel env pull .env.local
```

`.env.local` may contain secrets and must never be committed. Do not paste its
contents into terminal output, logs, issues, pull requests, or chat messages.
Do not use `vercel env pull` for a presence-only evidence check.

## Secure context note

Microphone recording requires a secure browser context. Use either:

- `https://*.vercel.app`, or
- `http://localhost:<port>` for local development.

Plain LAN URLs such as `http://10.x.x.x:3110` commonly fail browser microphone
security checks even when the application code is correct.
