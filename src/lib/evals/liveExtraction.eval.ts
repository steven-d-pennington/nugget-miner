import { mkdir, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import canonicalFixturesJson from './fixtures/canonical.json';
import {
  passesMvpGates,
  scoreCanonicalEvaluation,
  type CanonicalFixture,
  type ScoredEvalCase,
} from './scoring';
import { LIVE_FIXTURE_DEADLINE_MS, resolveAuthorizedLiveConfig } from './liveConfig';
import { sha256Text } from '@/lib/crypto/contentHash';
import { DEFAULT_CATEGORIES } from '@/lib/db/defaultCategories';
import {
  createOpenAIModelClient,
  getOrganizationPrompt,
  getSegmentationPrompt,
} from '@/lib/llm';
import { ORGANIZATION_PROMPT_VERSION } from '@/lib/llm/organizationPrompt';
import { SEGMENTATION_PROMPT_VERSION } from '@/lib/llm/segmentationPrompt';
import { normalizeSegmentationSpans, validateOrganizationGrounding } from '@/lib/validation/grounding';
import {
  ORGANIZATION_SCHEMA_VERSION,
  organizationResultSchema,
  parseOrganizationResult,
} from '@/lib/validation/organizationResult';
import {
  SEGMENTATION_SCHEMA_VERSION,
  parseSegmentationResult,
  segmentationResultSchema,
} from '@/lib/validation/segmentationResult';

const EVAL_SAFETY_IDENTIFIER = '00000000-0000-4000-8000-000000000007';
const REPORT_PATH = path.join(process.cwd(), 'docs', 'evals', 'latest.json');
const canonicalFixtures = canonicalFixturesJson as CanonicalFixture[];

describe.sequential('live GPT-5.6 canonical extraction evaluation', () => {
  let config!: ReturnType<typeof resolveAuthorizedLiveConfig>;
  let client!: ReturnType<typeof createOpenAIModelClient>;
  const allowedCategoryIds = new Set(DEFAULT_CATEGORIES.map((category) => category.id));
  const cases: ScoredEvalCase[] = [];
  const modelResults: Array<{
    fixtureId: string;
    transcriptHash: string;
    segmentationResponseId: string;
    organizationResponseId: string;
    segmentation: ReturnType<typeof parseSegmentationResult>;
    organization: ReturnType<typeof parseOrganizationResult>;
  }> = [];

  beforeAll(() => {
    config = resolveAuthorizedLiveConfig();
    client = createOpenAIModelClient({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
      timeoutMs: config.timeoutMs,
      reasoningEffort: config.reasoningEffort,
    });
  });

  for (const fixture of canonicalFixtures) {
    it(`extracts and organizes ${fixture.id}`, async () => {
      const abortController = new AbortController();
      const deadline = setTimeout(() => abortController.abort(), LIVE_FIXTURE_DEADLINE_MS);
      try {
        const transcriptHash = await sha256Text(fixture.transcript);
        const segmentPrompt = getSegmentationPrompt({
          transcriptHash,
          transcriptText: fixture.transcript,
        });
        const segmentResponse = await client.generateStructured({
          schema: segmentationResultSchema,
          schemaName: 'SegmentationResult',
          promptVersion: segmentPrompt.promptVersion,
          system: segmentPrompt.system,
          user: segmentPrompt.user,
          safetyIdentifier: EVAL_SAFETY_IDENTIFIER,
          maxOutputTokens: 1800,
          signal: abortController.signal,
        });
        const segmentation = normalizeSegmentationSpans(
          fixture.transcript,
          parseSegmentationResult(segmentResponse.parsed),
        );

        const organizePrompt = getOrganizationPrompt({
          candidates: segmentation.ideas,
          categories: DEFAULT_CATEGORIES,
        });
        const organizationResponse = await client.generateStructured({
          schema: organizationResultSchema,
          schemaName: 'OrganizationResult',
          promptVersion: organizePrompt.promptVersion,
          system: organizePrompt.system,
          user: organizePrompt.user,
          safetyIdentifier: EVAL_SAFETY_IDENTIFIER,
          maxOutputTokens: 4000,
          signal: abortController.signal,
        });
        const organization = parseOrganizationResult(organizationResponse.parsed);
        validateOrganizationGrounding(segmentation, organization);

        cases.push({ fixture, segmentation, organization });
        modelResults.push({
          fixtureId: fixture.id,
          transcriptHash,
          segmentationResponseId: segmentResponse.responseId,
          organizationResponseId: organizationResponse.responseId,
          segmentation,
          organization,
        });
      } finally {
        clearTimeout(deadline);
      }
    }, 180_000);
  }

  it('writes the complete report atomically and meets every gate', async () => {
    expect(cases).toHaveLength(canonicalFixtures.length);
    expect(modelResults).toHaveLength(canonicalFixtures.length);
    const scored = scoreCanonicalEvaluation(cases, allowedCategoryIds);
    const results = modelResults.map((result, index) => ({
      ...result,
      evaluation: scored.results[index],
    }));
    const report = {
      generatedAt: new Date().toISOString(),
      model: config.model,
      reasoningEffort: config.reasoningEffort,
      segmentationPromptVersion: SEGMENTATION_PROMPT_VERSION,
      organizationPromptVersion: ORGANIZATION_PROMPT_VERSION,
      schemaVersions: [SEGMENTATION_SCHEMA_VERSION, ORGANIZATION_SCHEMA_VERSION],
      score: scored.score,
      results,
    };

    await mkdir(path.dirname(REPORT_PATH), { recursive: true });
    const temporaryReportPath = `${REPORT_PATH}.${process.pid}.${Date.now()}.tmp`;
    try {
      await writeFile(temporaryReportPath, `${JSON.stringify(report, null, 2)}\n`, {
        encoding: 'utf8',
        mode: 0o600,
      });
      await rename(temporaryReportPath, REPORT_PATH);
    } catch (error) {
      await unlink(temporaryReportPath).catch(() => undefined);
      throw error;
    }

    expect(passesMvpGates(scored.score)).toBe(true);
    expect(scored.results.every((result) => result.specialRequirementsPassed)).toBe(true);
  });
});
