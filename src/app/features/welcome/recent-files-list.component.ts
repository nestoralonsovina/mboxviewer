import { Component, input, output } from '@angular/core';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { formatRelativeDate } from '../../core/utils/format';
import type { RecentFile } from '../../core/models/mbox.models';

@Component({
  selector: 'app-recent-files-list',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './recent-files-list.component.html',
})
export class RecentFilesListComponent {
  readonly recentFiles = input.required<readonly RecentFile[]>();

  readonly openRecent = output<string>();
  readonly removeRecent = output<string>();

  formatRecentDate(dateStr: string): string {
    return formatRelativeDate(dateStr);
  }

  onRemove(path: string, event: Event): void {
    event.stopPropagation();
    this.removeRecent.emit(path);
  }
}
