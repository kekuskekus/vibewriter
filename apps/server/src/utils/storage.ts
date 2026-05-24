import { mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

export const STORAGE_BASE = process.env.STORAGE_PATH || join(homedir(), '.focus-writer', 'documents');
export const DRAFTS_PATH = process.env.DRAFTS_PATH || join(homedir(), '.focus-writer', 'drafts');
export const EXPORTS_PATH = process.env.EXPORTS_PATH || join(homedir(), '.focus-writer', 'exports');
export const AFFINE_SYNC_PATH = process.env.AFFINE_SYNC_PATH || join(homedir(), '.focus-writer', 'affine-sync');

export async function initializeStorage() {
  const paths = [STORAGE_BASE, DRAFTS_PATH, EXPORTS_PATH, AFFINE_SYNC_PATH];

  for (const path of paths) {
    try {
      await mkdir(path, { recursive: true });
    } catch (err) {
      console.error(`Failed to create directory ${path}:`, err);
    }
  }
}

export function sanitizeFileName(name: string): string {
  // Remove/replace invalid filename characters
  return name
    .replace(/[<>:"|?*\x00-\x1F]/g, '_')
    .replace(/^\.+/, '_')
    .substring(0, 255);
}
