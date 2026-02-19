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
  
  searchInput = '';

  async onOpenFile() {
    await this.mbox.openFile();
  }

  async onCloseFile() {
    await this.mbox.closeFile();
  }

  // Called on every keystroke for instant search
  onSearchInput(value: string) {
    this.searchInput = value;
    this.mbox.search(value);
  }

  onClearSearch() {
    this.searchInput = '';
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

  getFileName(path: string | null): string {
    if (!path) return '';
    return path.split('/').pop() || path.split('\\').pop() || path;
  }
}
