import { Component, input, output } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { EmailMetaComponent } from './email-meta.component';
import { EmailBodyComponent } from './email-body.component';
import { AttachmentsListComponent } from './attachments-list.component';
import type { AttachmentInfo, EmailBody, EmailEntry } from '../../../core/models/mbox.models';

@Component({
  selector: 'app-email-detail',
  standalone: true,
  imports: [IconComponent, EmailMetaComponent, EmailBodyComponent, AttachmentsListComponent],
  templateUrl: './email-detail.component.html',
  host: { class: 'max-md:fixed max-md:inset-0 max-md:z-50 max-md:flex max-md:flex-col' },
})
export class EmailDetailComponent {
  readonly email = input.required<EmailEntry>();
  readonly emailBody = input<EmailBody | null>(null);
  readonly isLoading = input(false);

  readonly closeDetail = output();
  readonly downloadAttachment = output<AttachmentInfo>();

  onClose(): void {
    this.closeDetail.emit();
  }

  onDownloadAttachment(attachment: AttachmentInfo): void {
    this.downloadAttachment.emit(attachment);
  }
}
