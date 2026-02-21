import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import type { LabelCount } from '../../../core/models/mbox.models';

@Component({
  selector: 'app-label-nav',
  standalone: true,
  imports: [DecimalPipe, IconComponent],
  template: `
    <nav class="flex-1 overflow-y-auto p-2">
      <button
        class="flex items-center gap-3 w-full px-3 py-2.5 text-sm bg-transparent border-none rounded cursor-pointer text-left transition-all duration-150"
        [class]="!selectedLabel() && !searchQuery()
          ? 'text-indigo-500 bg-indigo-500/10 font-medium'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-700'"
        (click)="labelClick.emit(null)">
        <app-icon name="activity" />
        All Mail
        <span class="ml-auto text-xs text-slate-400 dark:text-slate-500">{{ totalMessages() | number }}</span>
      </button>

      @for (label of labels(); track label.label) {
        <button
          class="flex items-center gap-3 w-full px-3 py-2.5 text-sm bg-transparent border-none rounded cursor-pointer text-left transition-all duration-150"
          [class]="selectedLabel() === label.label
            ? 'text-indigo-500 bg-indigo-500/10 font-medium'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-700'"
          (click)="labelClick.emit(label.label)">
          <app-icon name="tag" />
          {{ label.label }}
          <span class="ml-auto text-xs text-slate-400 dark:text-slate-500">{{ label.count | number }}</span>
        </button>
      }
    </nav>
  `,
})
export class LabelNavComponent {
  readonly labels = input.required<readonly LabelCount[]>();
  readonly selectedLabel = input.required<string | null>();
  readonly searchQuery = input.required<string>();
  readonly totalMessages = input.required<number>();

  readonly labelClick = output<string | null>();
}
