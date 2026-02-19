import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MboxStateService } from './state/mbox-state.service';
import { ErrorToastComponent } from './shared/components/error-toast/error-toast.component';
import { WelcomeComponent } from './features/welcome/welcome.component';
import { SidebarComponent } from './features/mail/sidebar/sidebar.component';
import { SearchToolbarComponent } from './features/mail/toolbar/search-toolbar.component';
import { EmailListComponent } from './features/mail/email-list/email-list.component';
import { EmailDetailComponent } from './features/mail/email-detail/email-detail.component';
import type { AttachmentInfo, EmailEntry } from './core/models/mbox.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ErrorToastComponent, WelcomeComponent, SidebarComponent, SearchToolbarComponent, EmailListComponent, EmailDetailComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly mbox = inject(MboxStateService);

  async onOpenFile() {
    await this.mbox.openFile();
  }

  async onCloseFile() {
    await this.mbox.closeFile();
  }

  onSearchInput(value: string): void {
    this.mbox.search(value);
  }

  onClearSearch(): void {
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

  async onRemoveRecentFile(path: string) {
    await this.mbox.removeFromRecentFiles(path);
  }
}
