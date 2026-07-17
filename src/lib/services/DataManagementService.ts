import { db } from '@/lib/db';
import { categoryRepository, settingsRepository } from '@/lib/repositories';

export const DataManagementService = {
  async deleteAll() {
    await db.transaction(
      'rw',
      [
        db.recordings,
        db.transcripts,
        db.extractionRuns,
        db.ideas,
        db.nuggets,
        db.questions,
        db.actionItems,
        db.tags,
        db.captureSessions,
        db.categories,
        db.settings,
      ],
      async () => {
        await Promise.all([
          db.recordings.clear(),
          db.transcripts.clear(),
          db.extractionRuns.clear(),
          db.ideas.clear(),
          db.nuggets.clear(),
          db.questions.clear(),
          db.actionItems.clear(),
          db.tags.clear(),
          db.captureSessions.clear(),
          db.categories.clear(),
          db.settings.clear(),
        ]);
      },
    );

    await categoryRepository.ensureDefaults();
    await settingsRepository.get();
  },
};
