import { Component, inject } from '@angular/core';
import { MboxStateService } from '../../state/mbox-state.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { SearchToolbarComponent } from './toolbar/search-toolbar.component';
import { EmailListComponent } from './email-list/email-list.component';
import { EmailDetailComponent } from './email-detail/email-detail.component';
import type { AttachmentInfo, EmailEntry } from '../../core/models/mbox.models';

@Component({
  selector: 'app-mail-shell',
  standalone: true,
  imports: [
    SidebarComponent,
    SearchToolbarComponent,
    EmailListComponent,
    EmailDetailComponent,
  ],
  templateUrl: './mail-shell.component.html',
  styleUrl: './mail-shell.component.css',
})
export class MailShellComponent {
  protected readonly mbox = inject(MboxStateService);

  async onOpenFile(): Promise<void> {
    await this.mbox.openFile();
  }

  async onCloseFile(): Promise<void> {
    await this.mbox.closeFile();
  }

  onSearchInput(value: string): void {
    this.mbox.search(value);
  }

  onClearSearch(): void {
    this.mbox.search('');
  }

  async onLabelClick(label: string | null): Promise<void> {
    await this.mbox.filterByLabel(label);
  }

  async onEmailClick(email: EmailEntry): Promise<void> {
    await this.mbox.selectEmail(email);
  }

  async onDownloadAttachment(attachment: AttachmentInfo): Promise<void> {
    const email = this.mbox.selectedEmail();
    if (email) {
      await this.mbox.downloadAttachment(email.index, attachment);
    }
  }

  onCloseEmail(): void {
    this.mbox.clearSelection();
  }
}
