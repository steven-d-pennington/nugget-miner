import { publicLlmConfig, resolveLlmConfig } from '@/lib/llm';
import { publicTranscriptionConfig, resolveTranscriptionConfig } from '@/lib/server/transcriptionConfig';

export async function GET() {
  const transcription = publicTranscriptionConfig(resolveTranscriptionConfig());
  const organization = publicLlmConfig(resolveLlmConfig());

  return Response.json({
    status: 'ok',
    transcription: { available: transcription.available, model: transcription.model },
    organization: { available: organization.available, model: organization.model },
  });
}
