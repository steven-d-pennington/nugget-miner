import { db } from '@/lib/db';
import type { AppSettings } from '@/types';

export const DEFAULT_APP_SETTINGS = {
  key: 'app',
  automaticProcessing: false,
  cloudProcessingConsent: 'unknown',
} as const;

export type AppSettingsPatch = Partial<Pick<AppSettings, 'automaticProcessing' | 'cloudProcessingConsent'>>;

export const settingsRepository = {
  async get(): Promise<AppSettings> {
    return db.transaction('rw', db.settings, async () => {
      const existing = await db.settings.get('app');
      if (existing) return existing;
      const timestamp = Date.now();
      const settings: AppSettings = {
        ...DEFAULT_APP_SETTINGS,
        clientId: crypto.randomUUID(),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await db.settings.add(settings);
      return settings;
    });
  },

  async update(patch: AppSettingsPatch): Promise<AppSettings> {
    const existing = await this.get();
    const updated = { ...existing, ...patch, updatedAt: Date.now() };
    await db.settings.put(updated);
    return updated;
  },
};
