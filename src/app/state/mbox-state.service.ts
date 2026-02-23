import { Injectable, inject, signal, computed } from '@angular/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { MboxApiService } from '../core/tauri/mbox-api.service';
import { SettingsStoreService } from '../core/store/settings-store.service';
import { errorMessage } from '../core/utils/error';
import { mimeToExtension } from '../core/utils/format';
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
  private readonly translate = inject(TranslateService);

  private readonly _loadingFile = signal(false);
  private readonly _loadingEmails = signal(false);
  private readonly _loadingMore = signal(false);
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
  private readonly _hasMore = signal(false);
  private readonly _currentOffset = signal(0);

  private readonly PAGE_SIZE = 50;

  private readonly searchSubject = new Subject<string>();
  private currentSearchId = 0;

  readonly loadingFile = this._loadingFile.asReadonly();
  readonly loadingEmails = this._loadingEmails.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
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
  readonly hasMore = this._hasMore.asReadonly();

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
          { name: this.translate.instant('FILE_DIALOG.MBOX_FILES'), extensions: ['mbox'] },
          { name: this.translate.instant('FILE_DIALOG.ALL_FILES'), extensions: ['*'] },
        ],
      });

      if (typeof selected === 'string') {
        await this.loadMbox(selected);
      }
    } catch (err) {
      this._error.set(`${this.translate.instant('ERRORS.OPEN_DIALOG')}: ${errorMessage(err)}`);
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
      this._error.set(`${this.translate.instant('ERRORS.OPEN_MBOX')}: ${errorMessage(err)}`);
      this._stats.set(null);
      await this.removeFromRecentFiles(path);
    } finally {
      this._loadingFile.set(false);
    }
  }

  async loadEmails(): Promise<void> {
    this._loadingEmails.set(true);
    this._currentOffset.set(0);

    try {
      const emails = await this.api.getEmails(0, this.PAGE_SIZE);
      this._emails.set(emails);

      const stats = this._stats();
      this._hasMore.set(stats !== null && emails.length < stats.total_messages);
      this._currentOffset.set(emails.length);
    } catch (err) {
      this._error.set(`${this.translate.instant('ERRORS.LOAD_EMAILS')}: ${errorMessage(err)}`);
    } finally {
      this._loadingEmails.set(false);
    }
  }

  async loadMoreEmails(): Promise<void> {
    if (this._loadingMore() || !this._hasMore()) {
      return;
    }

    this._loadingMore.set(true);

    try {
      const offset = this._currentOffset();
      const moreEmails = await this.api.getEmails(offset, this.PAGE_SIZE);

      if (moreEmails.length > 0) {
        this._emails.update((current) => [...current, ...moreEmails]);
        this._currentOffset.set(offset + moreEmails.length);

        const stats = this._stats();
        this._hasMore.set(
          stats !== null && offset + moreEmails.length < stats.total_messages,
        );
      } else {
        this._hasMore.set(false);
      }
    } catch (err) {
      this._error.set(`${this.translate.instant('ERRORS.LOAD_MORE')}: ${errorMessage(err)}`);
    } finally {
      this._loadingMore.set(false);
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
        this._error.set(`${this.translate.instant('ERRORS.SEARCH')}: ${errorMessage(err)}`);
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
      this._error.set(`${this.translate.instant('ERRORS.FILTER_LABEL')}: ${errorMessage(err)}`);
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
      this._error.set(`${this.translate.instant('ERRORS.LOAD_EMAIL')}: ${errorMessage(err)}`);
    } finally {
      this._loadingEmailBody.set(false);
    }
  }

  async downloadAttachment(
    emailIndex: number,
    attachment: AttachmentInfo,
  ): Promise<void> {
    try {
      const ext = mimeToExtension(attachment.content_type);
      const allFilesLabel = this.translate.instant('FILE_DIALOG.ALL_FILES');
      const filters = ext
        ? [
            { name: ext.toUpperCase(), extensions: [ext] },
            { name: allFilesLabel, extensions: ['*'] },
          ]
        : [{ name: allFilesLabel, extensions: ['*'] }];

      const savePath = await save({
        defaultPath: attachment.filename,
        filters,
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
        `${this.translate.instant('ERRORS.DOWNLOAD_ATTACHMENT')}: ${errorMessage(err)}`,
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
      this._error.set(`${this.translate.instant('ERRORS.CLOSE_FILE')}: ${errorMessage(err)}`);
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
