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
      <div class="mb-4">
        <h3 class="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 m-0 mb-3">
          <app-icon name="attachment" />
          Attachments ({{ items.length }})
        </h3>
        <div class="flex flex-wrap gap-2">
          @for (attachment of items; track attachment.part_index) {
            <button
              class="flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer transition-all duration-150 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-indigo-500"
              (click)="onDownload(attachment)"
            >
              <app-icon name="file" [size]="20" class="text-slate-400 dark:text-slate-500 shrink-0" />
              <div class="flex flex-col min-w-0">
                <span class="text-[13px] font-medium text-slate-900 dark:text-slate-50 truncate">{{ attachment.filename }}</span>
                <span class="text-xs text-slate-400 dark:text-slate-500">{{ fileSizeDisplay(attachment.size) }}</span>
              </div>
              <app-icon name="download" class="text-indigo-500" />
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
