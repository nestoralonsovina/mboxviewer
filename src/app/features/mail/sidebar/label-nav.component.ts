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
        class="flex items-center gap-3 w-full px-3 py-2.5 text-sm bg-transparent border-none rounded-lg cursor-pointer text-left transition-all duration-150"
        [class]="!selectedLabel() && !searchQuery()
          ? 'text-accent bg-accent-subtle dark:bg-accent/20 font-semibold'
          : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-50 hover:bg-surface-100 dark:hover:bg-surface-800'"
        (click)="labelClick.emit(null)">
        <app-icon name="mail" [size]="18" />
        <span class="flex-1">All Mail</span>
        <span class="text-xs font-medium text-surface-400 dark:text-surface-500 tabular-nums">{{ totalMessages() | number }}</span>
      </button>

      @if (labels().length > 0) {
        <div class="mt-4 mb-2 px-3">
          <span class="text-[10px] font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500">Labels</span>
        </div>
      }

      @for (label of labels(); track label.label) {
        <button
          class="flex items-center gap-3 w-full px-3 py-2 text-sm bg-transparent border-none rounded-lg cursor-pointer text-left transition-all duration-150"
          [class]="selectedLabel() === label.label
            ? 'text-accent bg-accent-subtle dark:bg-accent/20 font-semibold'
            : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-50 hover:bg-surface-100 dark:hover:bg-surface-800'"
          (click)="labelClick.emit(label.label)">
          <app-icon name="tag" [size]="16" />
          <span class="flex-1 truncate">{{ label.label }}</span>
          <span class="text-xs font-medium text-surface-400 dark:text-surface-500 tabular-nums">{{ label.count | number }}</span>
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
