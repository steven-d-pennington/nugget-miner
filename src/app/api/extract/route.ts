import { publicLlmConfig, resolveLlmConfig } from '@/lib/llm';

export async function GET() {
  return Response.json(publicLlmConfig(resolveLlmConfig()));
}
