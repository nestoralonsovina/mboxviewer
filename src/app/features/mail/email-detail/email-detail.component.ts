import { Component, input, output, inject, computed } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { formatDate } from '../../../core/utils/format';
import type { AttachmentInfo, EmailBody, EmailEntry } from '../../../core/models/mbox.models';

@Component({
  selector: 'app-email-detail',
  standalone: true,
  imports: [IconComponent, SpinnerComponent],
  templateUrl: './email-detail.component.html',
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }
  `,
})
export class EmailDetailComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly email = input.required<EmailEntry>();
  readonly emailBody = input<EmailBody | null>(null);
  readonly isLoading = input(false);

  readonly closeDetail = output();
  readonly downloadAttachment = output<AttachmentInfo>();

  /** Sanitized HTML content for direct rendering */
  readonly sanitizedHtml = computed(() => {
    const body = this.emailBody();
    if (!body?.html) return null;
    return this.sanitizer.bypassSecurityTrustHtml(body.html);
  });

  formattedDate(): string {
    return formatDate(this.email().date);
  }

  onClose(): void {
    this.closeDetail.emit();
  }

  onDownloadAttachment(attachment: AttachmentInfo): void {
    this.downloadAttachment.emit(attachment);
  }
}
