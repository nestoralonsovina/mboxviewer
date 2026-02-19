import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MboxService, EmailEntry, AttachmentInfo } from './services/mbox.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  readonly mbox = inject(MboxService);
  
  searchValue = '';

  async onOpenFile() {
    await this.mbox.openFile();
  }

  async onCloseFile() {
    await this.mbox.closeFile();
  }

  // Called on every keystroke for instant search
  onSearchInput(value: string) {
    this.searchValue = value;
    this.mbox.search(value);
  }

  onClearSearch() {
    this.searchValue = '';
    this.mbox.search('');
  }

  async onLabelClick(label: string | null) {
    await this.mbox.filterByLabel(label);
  }

  async onEmailClick(email: EmailEntry) {
    await this.mbox.selectEmail(email);
  }

  async onDownloadAttachment(attachment: AttachmentInfo) {
    const email = this.mbox.selectedEmail();
    if (email) {
      await this.mbox.downloadAttachment(email.index, attachment);
    }
  }

  onCloseEmail() {
    this.mbox.clearSelection();
  }

  onDismissError() {
    this.mbox.clearError();
  }

  async onOpenRecentFile(path: string) {
    await this.mbox.loadMbox(path);
  }

  async onRemoveRecentFile(path: string, event: Event) {
    event.stopPropagation();
    await this.mbox.removeFromRecentFiles(path);
  }

  getFileName(path: string | null): string {
    if (!path) return '';
    return path.split('/').pop() || path.split('\\').pop() || path;
  }

  formatRecentDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}
