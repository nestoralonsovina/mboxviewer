import { Injectable, inject, signal, computed } from '@angular/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MboxApiService } from '../core/tauri/mbox-api.service';
import { SettingsStoreService } from '../core/store/settings-store.service';
import { errorMessage } from '../core/utils/error';
import type {
  AttachmentInfo,
  EmailBody,
  EmailEntry,
  MboxStats,
  RecentFile,
} from '../core/models/mbox.models';

@Injectable({
  providedIn: 'root',
})
export class MboxStateService {
  private readonly api = inject(MboxApiService);
  private readonly settingsStore = inject(SettingsStoreService);

  private readonly _loadingFile = signal(false);
  private readonly _loadingEmails = signal(false);
  private readonly _loadingEmailBody = signal(false);
  private readonly _isSearching = signal(false);
  private readonly _isInitialized = signal(false);
  private readonly _stats = signal<MboxStats | null>(null);
  private readonly _emails = signal<EmailEntry[]>([]);
  private readonly _searchResultsCount = signal<number | null>(null);
  private readonly _selectedEmail = signal<EmailEntry | null>(null);
  private readonly _selectedEmailBody = signal<EmailBody | null>(null);
  private readonly _searchQuery = signal('');
  private readonly _selectedLabel = signal<string | null>(null);
  private readonly _currentPath = signal<string | null>(null);
  private readonly _error = signal<string | null>(null);
  private readonly _recentFiles = signal<RecentFile[]>([]);

  private readonly searchSubject = new Subject<string>();
  private currentSearchId = 0;

  readonly loadingFile = this._loadingFile.asReadonly();
  readonly loadingEmails = this._loadingEmails.asReadonly();
  readonly loadingEmailBody = this._loadingEmailBody.asReadonly();
  readonly isSearching = this._isSearching.asReadonly();
  readonly isInitialized = this._isInitialized.asReadonly();
  readonly stats = this._stats.asReadonly();
  readonly emails = this._emails.asReadonly();
  readonly searchResultsCount = this._searchResultsCount.asReadonly();
  readonly selectedEmail = this._selectedEmail.asReadonly();
  readonly selectedEmailBody = this._selectedEmailBody.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly selectedLabel = this._selectedLabel.asReadonly();
  readonly currentPath = this._currentPath.asReadonly();
  readonly error = this._error.asReadonly();
  readonly recentFiles = this._recentFiles.asReadonly();

  readonly isFileOpen = computed(() => this._stats() !== null);
  readonly labels = computed(() => this._stats()?.labels ?? []);

  constructor() {
    this.searchSubject
      .pipe(debounceTime(150), distinctUntilChanged())
      .subscribe((query) => {
        void this.executeSearch(query);
      });
  }

  async initialize(): Promise<void> {
    try {
      await this.settingsStore.initialize();

      const recentFiles = await this.settingsStore.getRecentFiles();
      this._recentFiles.set(recentFiles);
      if (recentFiles.length > 0) {
        await this.loadMbox(recentFiles[0].path);
      }
    } catch (err) {
      console.error('Failed to initialize store:', err);
    } finally {
      this._isInitialized.set(true);
    }
  }

  private async addToRecentFiles(path: string): Promise<void> {
    const name = path.split('/').pop() ?? path.split('\\').pop() ?? path;
    const newEntry: RecentFile = {
      path,
      name,
      lastOpened: new Date().toISOString(),
    };

    const existing = this._recentFiles().filter((f) => f.path !== path);
    const updated = [newEntry, ...existing];

    this._recentFiles.set(updated);
    await this.settingsStore.saveRecentFiles(updated);
  }

  async removeFromRecentFiles(path: string): Promise<void> {
    const updated = this._recentFiles().filter((f) => f.path !== path);
    this._recentFiles.set(updated);
    await this.settingsStore.saveRecentFiles(updated);
  }

  async openFile(): Promise<void> {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: 'MBOX Files', extensions: ['mbox'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (typeof selected === 'string') {
        await this.loadMbox(selected);
      }
    } catch (err) {
      this._error.set(`Failed to open file dialog: ${errorMessage(err)}`);
    }
  }

  async loadMbox(path: string): Promise<void> {
    this._loadingFile.set(true);
    this._error.set(null);

    try {
      const stats = await this.api.openMbox(path);
      this._stats.set(stats);
      this._currentPath.set(path);

      await this.addToRecentFiles(path);
      await this.loadEmails();
    } catch (err) {
      this._error.set(`Failed to open MBOX: ${errorMessage(err)}`);
      this._stats.set(null);
      await this.removeFromRecentFiles(path);
    } finally {
      this._loadingFile.set(false);
    }
  }

  async loadEmails(offset = 0, limit = 100): Promise<void> {
    try {
      const emails = await this.api.getEmails(offset, limit);
      this._emails.set(emails);
    } catch (err) {
      this._error.set(`Failed to load emails: ${errorMessage(err)}`);
    }
  }

  search(query: string): void {
    this._searchQuery.set(query);
    this._selectedLabel.set(null);
    this._isSearching.set(true);
    this.searchSubject.next(query);
  }

  private async executeSearch(query: string): Promise<void> {
    const searchId = ++this.currentSearchId;

    try {
      if (query.trim()) {
        const results = await this.api.searchEmails(query, 500);

        if (searchId === this.currentSearchId) {
          this._emails.set([...results.emails]);
          this._searchResultsCount.set(results.total_count);
        }
      } else {
        if (searchId === this.currentSearchId) {
          this._searchResultsCount.set(null);
          await this.loadEmails();
        }
      }
    } catch (err) {
      if (searchId === this.currentSearchId) {
        this._error.set(`Search failed: ${errorMessage(err)}`);
      }
    } finally {
      if (searchId === this.currentSearchId) {
        this._isSearching.set(false);
      }
    }
  }

  async filterByLabel(label: string | null): Promise<void> {
    this._selectedLabel.set(label);
    this._searchQuery.set('');
    this._loadingEmails.set(true);

    try {
      if (label) {
        const results = await this.api.getEmailsByLabel(label);
        this._emails.set(results);
      } else {
        await this.loadEmails();
      }
    } catch (err) {
      this._error.set(`Failed to filter by label: ${errorMessage(err)}`);
    } finally {
      this._loadingEmails.set(false);
    }
  }

  async selectEmail(email: EmailEntry): Promise<void> {
    this._selectedEmail.set(email);
    this._selectedEmailBody.set(null);
    this._loadingEmailBody.set(true);

    try {
      const body = await this.api.getEmailBody(email.index);
      this._selectedEmailBody.set(body);
    } catch (err) {
      this._error.set(`Failed to load email: ${errorMessage(err)}`);
    } finally {
      this._loadingEmailBody.set(false);
    }
  }

  async downloadAttachment(
    emailIndex: number,
    attachment: AttachmentInfo,
  ): Promise<void> {
    try {
      const savePath = await save({
        defaultPath: attachment.filename,
        filters: [{ name: 'All Files', extensions: ['*'] }],
      });

      if (savePath) {
        const data = await this.api.getAttachment(
          emailIndex,
          attachment.part_index,
        );
        await writeFile(savePath, new Uint8Array(data));
      }
    } catch (err) {
      this._error.set(
        `Failed to download attachment: ${errorMessage(err)}`,
      );
    }
  }

  async closeFile(): Promise<void> {
    try {
      await this.api.closeMbox();
      this._stats.set(null);
      this._emails.set([]);
      this._selectedEmail.set(null);
      this._selectedEmailBody.set(null);
      this._searchQuery.set('');
      this._selectedLabel.set(null);
      this._currentPath.set(null);
    } catch (err) {
      this._error.set(`Failed to close file: ${errorMessage(err)}`);
    }
  }

  clearError(): void {
    this._error.set(null);
  }

  clearSelection(): void {
    this._selectedEmail.set(null);
    this._selectedEmailBody.set(null);
  }
}
