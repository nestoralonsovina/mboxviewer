import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { MboxStats } from '../../../core/models/mbox.models';

@Component({
  selector: 'app-sidebar-stats',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    @let s = stats();
    @if (s) {
      <div class="flex gap-6 px-4 py-4 border-b border-surface-200 dark:border-surface-800">
        <div class="flex flex-col">
          <span class="text-2xl font-bold text-surface-900 dark:text-surface-50 tracking-tight">{{ s.total_messages | number }}</span>
          <span class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">emails</span>
        </div>
        <div class="flex flex-col">
          <span class="text-2xl font-bold text-surface-900 dark:text-surface-50 tracking-tight">{{ s.total_with_attachments | number }}</span>
          <span class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">attachments</span>
        </div>
      </div>
    }
  `,
})
export class SidebarStatsComponent {
  readonly stats = input.required<MboxStats | null>();
}
