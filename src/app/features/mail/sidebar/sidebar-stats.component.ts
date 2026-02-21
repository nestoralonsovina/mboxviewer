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
      <div class="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div class="flex flex-col">
          <span class="text-xl font-semibold text-slate-900 dark:text-slate-50">{{ s.total_messages | number }}</span>
          <span class="text-xs text-slate-600 dark:text-slate-400">emails</span>
        </div>
        <div class="flex flex-col">
          <span class="text-xl font-semibold text-slate-900 dark:text-slate-50">{{ s.total_with_attachments | number }}</span>
          <span class="text-xs text-slate-600 dark:text-slate-400">with attachments</span>
        </div>
      </div>
    }
  `,
})
export class SidebarStatsComponent {
  readonly stats = input.required<MboxStats | null>();
}
