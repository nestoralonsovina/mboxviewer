import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { MboxStateService } from '../../state/mbox-state.service';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [DecimalPipe, IconComponent, TranslatePipe],
  templateUrl: './preferences.component.html',
  host: {
    class: 'block h-screen bg-surface-50 dark:bg-surface-900 select-none',
  },
})
export class PreferencesComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly mbox = inject(MboxStateService);

  readonly languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
  ];

  readonly currentLang = signal(this.translate.currentLang || 'en');
  readonly currentFile = signal<string | null>(null);
  readonly fileStats = signal<{ emails: number; attachments: number } | null>(null);

  ngOnInit(): void {
    // Get current file info from main window's state
    const path = this.mbox.currentPath();
    const stats = this.mbox.stats();
    
    this.currentFile.set(path);
    if (stats) {
      this.fileStats.set({
        emails: stats.total_messages,
        attachments: stats.total_with_attachments,
      });
    }
  }

  switchLanguage(code: string): void {
    this.translate.use(code);
    this.currentLang.set(code);
    localStorage.setItem('preferredLanguage', code);
  }

  async openFile(): Promise<void> {
    await this.mbox.openFile();
    // Refresh file info
    const path = this.mbox.currentPath();
    const stats = this.mbox.stats();
    this.currentFile.set(path);
    if (stats) {
      this.fileStats.set({
        emails: stats.total_messages,
        attachments: stats.total_with_attachments,
      });
    }
  }

  async closeFile(): Promise<void> {
    await this.mbox.closeFile();
    this.currentFile.set(null);
    this.fileStats.set(null);
  }

  async closeWindow(): Promise<void> {
    const window = getCurrentWindow();
    await window.close();
  }

  getFileName(path: string | null): string {
    if (!path) return '';
    const afterForwardSlash = path.split('/').pop() ?? path;
    return afterForwardSlash.split('\\').pop() ?? afterForwardSlash;
  }
}
