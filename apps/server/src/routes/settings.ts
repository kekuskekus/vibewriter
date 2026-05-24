import { FastifyInstance } from 'fastify';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { AppSettings } from '../types.js';

const SETTINGS_FILE = join(homedir(), '.focus-writer', 'settings.json');

async function loadSettings(): Promise<AppSettings> {
  try {
    const content = await readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function saveSettings(settings: AppSettings): Promise<void> {
  await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export async function settingsRoutes(app: FastifyInstance) {
  // GET /api/settings - Get current settings
  app.get<{ Reply: any }>('/api/settings', async (request, reply) => {
    const settings = await loadSettings();
    // Don't expose sensitive paths directly; just return configured state
    return {
      success: true,
      data: {
        hasAffineSyncPath: !!settings.affineSyncPath,
      },
    };
  });

  // PUT /api/settings - Update settings
  app.put<{ Body: any; Reply: any }>('/api/settings', async (request, reply) => {
    const settings = await loadSettings();
    const body = request.body as any;

    // Update only allowed settings
    if (body?.affineSyncPath !== undefined) {
      settings.affineSyncPath = body.affineSyncPath;
    }

    await saveSettings(settings);
    return { success: true, data: settings };
  });
}
