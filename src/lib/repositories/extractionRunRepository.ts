import { db } from '@/lib/db';
import { StorageError } from '@/lib/errors';
import { EXTRACTION_SCHEMA_VERSION } from '@/lib/validation/extractionResult';
import type { ExtractionPreset, ExtractionResult, ExtractionRun, JobStatus } from '@/types';

export interface CreateExtractionRunInput {
  ideaId: string;
  transcriptId: string;
  provider: string;
  preset: ExtractionPreset;
  promptVersion: string;
  result: ExtractionResult;
  status?: JobStatus;
}

export const extractionRunRepository = {
  async create(input: CreateExtractionRunInput): Promise<ExtractionRun> {
    try {
      const createdAt = Date.now();
      const run: ExtractionRun = {
        id: crypto.randomUUID(),
        ideaId: input.ideaId,
        transcriptId: input.transcriptId,
        provider: input.provider,
        preset: input.preset,
        promptVersion: input.promptVersion,
        schemaVersion: EXTRACTION_SCHEMA_VERSION,
        status: input.status ?? 'complete',
        rawJson: JSON.stringify(input.result),
        summary: input.result.summary,
        warnings: input.result.warnings,
        createdAt,
      };
      await db.extractionRuns.add(run);
      return run;
    } catch (error) {
      throw new StorageError(error instanceof Error ? error.message : undefined);
    }
  },

  async getById(id: string): Promise<ExtractionRun | undefined> {
    return db.extractionRuns.get(id);
  },

  async listByIdea(ideaId: string): Promise<ExtractionRun[]> {
    return db.extractionRuns.where('ideaId').equals(ideaId).sortBy('createdAt');
  },

  async latestForIdea(ideaId: string): Promise<ExtractionRun | undefined> {
    const runs = await this.listByIdea(ideaId);
    return runs.at(-1);
  },
};
