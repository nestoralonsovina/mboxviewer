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
      <div class="mb-6">
        <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 m-0 mb-3">
          <app-icon name="attachment" [size]="14" />
          {{ items.length }} Attachment{{ items.length > 1 ? 's' : '' }}
        </h3>
        <div class="flex flex-wrap gap-2">
          @for (attachment of items; track attachment.part_index) {
            <button
              class="group flex items-center gap-3 px-4 py-3 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl cursor-pointer transition-all duration-150 hover:bg-white dark:hover:bg-surface-700 hover:border-accent hover:shadow-sm"
              (click)="onDownload(attachment)"
            >
              <div class="flex items-center justify-center w-10 h-10 bg-surface-100 dark:bg-surface-700 rounded-lg group-hover:bg-accent-subtle dark:group-hover:bg-accent/20 transition-colors">
                <app-icon name="file" [size]="20" class="text-surface-500 group-hover:text-accent transition-colors" />
              </div>
              <div class="flex flex-col min-w-0 text-left">
                <span class="text-sm font-medium text-surface-900 dark:text-surface-50 truncate max-w-[200px]">{{ attachment.filename }}</span>
                <span class="text-xs text-surface-400 dark:text-surface-500">{{ fileSizeDisplay(attachment.size) }}</span>
              </div>
              <app-icon name="download" [size]="18" class="text-surface-400 group-hover:text-accent transition-colors ml-2" />
            </button>
          }
        </div>
      </div>
    }
  `,
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
