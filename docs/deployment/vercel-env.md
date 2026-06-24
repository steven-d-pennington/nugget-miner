# Vercel transcription environment

Nugget's real transcription path is server-only. The browser sends audio to
`/api/transcribe` only after explicit consent, and the route reads provider
credentials from Vercel environment variables. Provider keys must never be placed
in client code, IndexedDB, localStorage, screenshots, commits, or chat logs.

## Check current project env

```bash
vercel env ls
```

## Required API key

Preferred:

```bash
vercel env add NUGGET_TRANSCRIPTION_API_KEY production
vercel env add NUGGET_TRANSCRIPTION_API_KEY preview
vercel env add NUGGET_TRANSCRIPTION_API_KEY development
```

Compatible fallback if the project already uses OpenAI naming:

```bash
vercel env add OPENAI_API_KEY production
vercel env add OPENAI_API_KEY preview
vercel env add OPENAI_API_KEY development
```

## Optional provider settings

| Purpose | Preferred | Fallback | Default |
| --- | --- | --- | --- |
| Base URL | `NUGGET_TRANSCRIPTION_BASE_URL` | `OPENAI_BASE_URL` | `https://api.openai.com/v1` |
| Model | `NUGGET_TRANSCRIPTION_MODEL` | `OPENAI_TRANSCRIPTION_MODEL` | `whisper-1` |
| Timeout | `NUGGET_TRANSCRIPTION_TIMEOUT_MS` | — | `60000` |
| Max upload bytes | `NUGGET_TRANSCRIPTION_MAX_BYTES` | — | `26214400` |

## Pull env locally for manual smoke tests

```bash
vercel env pull .env.local
```

`.env.local` is gitignored. Do not paste its contents into terminal output, logs,
issues, PRs, or chat.

## Secure context note

Microphone recording requires a secure browser context. Use either:

- `https://*.vercel.app`, or
- `http://localhost:<port>` for local development.

Plain LAN URLs like `http://10.x.x.x:3110` commonly fail browser mic security
checks even when the application code is correct.
