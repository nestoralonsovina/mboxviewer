import { Component, input, output } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { SidebarStatsComponent } from './sidebar-stats.component';
import { LabelNavComponent } from './label-nav.component';
import { getFileName } from '../../../core/utils/format';
import type { LabelCount, MboxStats } from '../../../core/models/mbox.models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [IconComponent, SidebarStatsComponent, LabelNavComponent],
  templateUrl: './sidebar.component.html',
  host: {
    '[class]': 'hostClasses',
  },
})
export class SidebarComponent {
  readonly stats = input.required<MboxStats | null>();
  readonly labels = input.required<readonly LabelCount[]>();
  readonly selectedLabel = input.required<string | null>();
  readonly searchQuery = input.required<string>();
  readonly currentPath = input.required<string | null>();
  readonly collapsed = input(false);

  readonly openFile = output();
  readonly closeFile = output();
  readonly labelClick = output<string | null>();
  readonly toggleCollapse = output();

  formatFileName(path: string | null): string {
    return getFileName(path);
  }

  get totalMessages(): number {
    return this.stats()?.total_messages ?? 0;
  }

  get hostClasses(): string {
    return this.collapsed()
      ? 'flex flex-col w-14 bg-surface-50 dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 transition-all duration-300 ease-out'
      : 'flex flex-col w-64 bg-surface-50 dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 max-lg:w-56 max-md:w-full max-md:max-h-[40vh] transition-all duration-300 ease-out';
  }
}
