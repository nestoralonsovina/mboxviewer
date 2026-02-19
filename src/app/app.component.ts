import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MboxStateService } from './state/mbox-state.service';
import { IconComponent } from './shared/components/icon/icon.component';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';
import {
  getFileName as getFileNameUtil,
  formatRelativeDate,
  formatDate as formatDateUtil,
  formatFileSize as formatFileSizeUtil,
  formatSender as formatSenderUtil,
} from './core/utils/format';
import type { AttachmentInfo, EmailEntry } from './core/models/mbox.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, SpinnerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly mbox = inject(MboxStateService);

  searchValue = '';

  async onOpenFile() {
    await this.mbox.openFile();
  }

  async onCloseFile() {
    await this.mbox.closeFile();
  }

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
    return getFileNameUtil(path);
  }

  formatRecentDate(dateStr: string): string {
    return formatRelativeDate(dateStr);
  }

  formatDate(dateStr: string): string {
    return formatDateUtil(dateStr);
  }

  formatFileSize(bytes: number): string {
    return formatFileSizeUtil(bytes);
  }

  formatSender(email: EmailEntry): string {
    return formatSenderUtil(email);
  }
}
