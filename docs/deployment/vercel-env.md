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
| `NUGGET_LLM_MODEL` | Organization model | `gpt-5.6` |
| `NUGGET_LLM_REASONING_EFFORT` | GPT-5.6 reasoning effort | `medium` |
| `NUGGET_TRANSCRIPTION_MAX_BYTES` | Maximum transcription upload size | `26214400` |
| `NUGGET_LLM_MAX_INPUT_CHARS` | Maximum transcript input length | `24000` |
| `NUGGET_TRANSCRIPTION_TIMEOUT_MS` | Transcription request timeout | `60000` |
| `NUGGET_LLM_TIMEOUT_MS` | Organization request timeout | `90000` |

Only add an override in Vercel when the deployment must differ from these
defaults.

## Pull environment values locally

```powershell
vercel env pull .env.local
```

`.env.local` may contain secrets and must never be committed. Do not paste its
contents into terminal output, logs, issues, pull requests, or chat messages.

## Secure context note

Microphone recording requires a secure browser context. Use either:

- `https://*.vercel.app`, or
- `http://localhost:<port>` for local development.

Plain LAN URLs such as `http://10.x.x.x:3110` commonly fail browser microphone
security checks even when the application code is correct.
