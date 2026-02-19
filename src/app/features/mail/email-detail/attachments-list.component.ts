import { Component, input, output } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { formatFileSize } from '../../../core/utils/format';
import type { AttachmentInfo } from '../../../core/models/mbox.models';

@Component({
  selector: 'app-attachments-list',
  standalone: true,
  imports: [IconComponent],
  template: `
    @let items = attachments();
    @if (items.length > 0) {
      <div class="attachments-section">
        <h3>
          <app-icon name="attachment" />
          Attachments ({{ items.length }})
        </h3>
        <div class="attachments-list">
          @for (attachment of items; track attachment.part_index) {
            <button class="attachment-item" (click)="onDownload(attachment)">
              <app-icon name="file" [size]="20" />
              <div class="attachment-info">
                <span class="attachment-name">{{ attachment.filename }}</span>
                <span class="attachment-size">{{ fileSizeDisplay(attachment.size) }}</span>
              </div>
              <app-icon name="download" class="download-icon" />
            </button>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './attachments-list.component.css',
})
export class AttachmentsListComponent {
  readonly attachments = input.required<readonly AttachmentInfo[]>();

  readonly downloadAttachment = output<AttachmentInfo>();

  fileSizeDisplay(bytes: number): string {
    return formatFileSize(bytes);
  }

  onDownload(attachment: AttachmentInfo): void {
    this.downloadAttachment.emit(attachment);
  }
}
