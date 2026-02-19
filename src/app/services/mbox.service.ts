import { Injectable, signal, computed, effect } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface EmailAddress {
  name: string;
  address: string;
}

export interface EmailEntry {
  index: number;
  offset: number;
  length: number;
  date: string;
  from_name: string;
  from_address: string;
  to: EmailAddress[];
  cc: EmailAddress[];
  subject: string;
  has_attachments: boolean;
  labels: string[];
}

export interface EmailBody {
  text: string | null;
  html: string | null;
  raw_headers: string;
  attachments: AttachmentInfo[];
}

export interface AttachmentInfo {
  filename: string;
  content_type: string;
  size: number;
  part_index: number;
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface MboxStats {
  total_messages: number;
  total_with_attachments: number;
  labels: LabelCount[];
}

export interface SearchResults {
  emails: EmailEntry[];
  total_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class MboxService {
  // Signals for reactive state management
  private _isLoading = signal(false);
  private _isSearching = signal(false);
  private _stats = signal<MboxStats | null>(null);
  private _emails = signal<EmailEntry[]>([]);
  private _searchResultsCount = signal<number | null>(null);
  private _selectedEmail = signal<EmailEntry | null>(null);
  private _selectedEmailBody = signal<EmailBody | null>(null);
  private _searchQuery = signal('');
  private _selectedLabel = signal<string | null>(null);
  private _currentPath = signal<string | null>(null);
  private _error = signal<string | null>(null);

  // Debounced search subject
  private searchSubject = new Subject<string>();
  
  // Track current search to cancel outdated searches
  private currentSearchId = 0;

  // Public readonly signals
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSearching = this._isSearching.asReadonly();
  readonly stats = this._stats.asReadonly();
  readonly emails = this._emails.asReadonly();
  readonly searchResultsCount = this._searchResultsCount.asReadonly();
  readonly selectedEmail = this._selectedEmail.asReadonly();
  readonly selectedEmailBody = this._selectedEmailBody.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly selectedLabel = this._selectedLabel.asReadonly();
  readonly currentPath = this._currentPath.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly isFileOpen = computed(() => this._stats() !== null);
  readonly labels = computed(() => this._stats()?.labels ?? []);

  constructor() {
    // Set up debounced search - 150ms delay for instant feel while avoiding too many calls
    this.searchSubject.pipe(
      debounceTime(150),
      distinctUntilChanged()
    ).subscribe(query => {
      this.executeSearch(query);
    });
  }

  async openFile(): Promise<void> {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: 'MBOX Files', extensions: ['mbox'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (selected) {
        await this.loadMbox(selected as string);
      }
    } catch (err) {
      this._error.set(`Failed to open file dialog: ${err}`);
    }
  }

  async loadMbox(path: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const stats = await invoke<MboxStats>('open_mbox', { path });
      this._stats.set(stats);
      this._currentPath.set(path);
      
      // Load initial emails
      await this.loadEmails();
    } catch (err) {
      this._error.set(`Failed to open MBOX: ${err}`);
      this._stats.set(null);
    } finally {
      this._isLoading.set(false);
    }
  }

  async loadEmails(offset = 0, limit = 100): Promise<void> {
    try {
      const emails = await invoke<EmailEntry[]>('get_emails', { offset, limit });
      this._emails.set(emails);
    } catch (err) {
      this._error.set(`Failed to load emails: ${err}`);
    }
  }

  // Called on every keystroke - debounces the actual search
  search(query: string): void {
    this._searchQuery.set(query);
    this._selectedLabel.set(null);
    this._isSearching.set(true);
    this.searchSubject.next(query);
  }

  // Actually executes the search after debounce
  private async executeSearch(query: string): Promise<void> {
    // Increment search ID to track this search
    const searchId = ++this.currentSearchId;
    
    try {
      if (query.trim()) {
        const results = await invoke<SearchResults>('search_emails', { query, limit: 500 });
        
        // Only update if this is still the current search
        if (searchId === this.currentSearchId) {
          this._emails.set(results.emails);
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
        this._error.set(`Search failed: ${err}`);
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
    this._isLoading.set(true);

    try {
      if (label) {
        const results = await invoke<EmailEntry[]>('get_emails_by_label', { label });
        this._emails.set(results);
      } else {
        await this.loadEmails();
      }
    } catch (err) {
      this._error.set(`Failed to filter by label: ${err}`);
    } finally {
      this._isLoading.set(false);
    }
  }

  async selectEmail(email: EmailEntry): Promise<void> {
    this._selectedEmail.set(email);
    this._selectedEmailBody.set(null);
    this._isLoading.set(true);

    try {
      const body = await invoke<EmailBody>('get_email_body', { index: email.index });
      this._selectedEmailBody.set(body);
    } catch (err) {
      this._error.set(`Failed to load email: ${err}`);
    } finally {
      this._isLoading.set(false);
    }
  }

  async downloadAttachment(emailIndex: number, attachment: AttachmentInfo): Promise<void> {
    try {
      const savePath = await save({
        defaultPath: attachment.filename,
        filters: [{ name: 'All Files', extensions: ['*'] }]
      });

      if (savePath) {
        const data = await invoke<number[]>('get_attachment', {
          emailIndex,
          attachmentIndex: attachment.part_index
        });
        
        await writeFile(savePath, new Uint8Array(data));
      }
    } catch (err) {
      this._error.set(`Failed to download attachment: ${err}`);
    }
  }

  async closeFile(): Promise<void> {
    try {
      await invoke('close_mbox');
      this._stats.set(null);
      this._emails.set([]);
      this._selectedEmail.set(null);
      this._selectedEmailBody.set(null);
      this._searchQuery.set('');
      this._selectedLabel.set(null);
      this._currentPath.set(null);
    } catch (err) {
      this._error.set(`Failed to close file: ${err}`);
    }
  }

  clearError(): void {
    this._error.set(null);
  }

  clearSelection(): void {
    this._selectedEmail.set(null);
    this._selectedEmailBody.set(null);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatSender(email: EmailEntry): string {
    if (email.from_name) {
      return email.from_name;
    }
    return email.from_address;
  }
}
