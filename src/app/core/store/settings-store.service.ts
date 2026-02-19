import { Injectable } from '@angular/core';
import { load, type Store } from '@tauri-apps/plugin-store';
import type { RecentFile } from '../models/mbox.models';

const STORE_FILE = 'settings.json';
const RECENT_FILES_KEY = 'recentFiles';
const MAX_RECENT_FILES = 10;

function isRecentFile(item: unknown): item is RecentFile {
  if (typeof item !== 'object' || item === null) {
    return false;
  }
  return (
    'path' in item &&
    typeof item.path === 'string' &&
    'name' in item &&
    typeof item.name === 'string' &&
    'lastOpened' in item &&
    typeof item.lastOpened === 'string'
  );
}

function isRecentFileArray(value: unknown): value is RecentFile[] {
  return Array.isArray(value) && value.every(isRecentFile);
}

@Injectable({
  providedIn: 'root',
})
export class SettingsStoreService {
  private store: Store | null = null;

  async initialize(): Promise<void> {
    this.store = await load(STORE_FILE);
  }

  async getRecentFiles(): Promise<RecentFile[]> {
    if (!this.store) {
      return [];
    }
    const raw: unknown = await this.store.get<unknown>(RECENT_FILES_KEY);
    if (isRecentFileArray(raw)) {
      return raw;
    }
    return [];
  }

  async saveRecentFiles(files: ReadonlyArray<RecentFile>): Promise<void> {
    const trimmed = files.slice(0, MAX_RECENT_FILES);
    if (this.store) {
      await this.store.set(RECENT_FILES_KEY, [...trimmed]);
    }
  }
}
