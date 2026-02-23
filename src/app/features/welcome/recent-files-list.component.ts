import { Component, inject, input, output } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IconComponent } from '../../shared/components/icon/icon.component';
import type { RecentFile } from '../../core/models/mbox.models';

@Component({
  selector: 'app-recent-files-list',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  templateUrl: './recent-files-list.component.html',
})
export class RecentFilesListComponent {
  private readonly translate = inject(TranslateService);

  readonly recentFiles = input.required<readonly RecentFile[]>();

  readonly openRecent = output<string>();
  readonly removeRecent = output<string>();

  formatRecentDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return this.translate.instant('DATE.TODAY');
    }
    if (diffDays === 1) {
      return this.translate.instant('DATE.YESTERDAY');
    }
    if (diffDays < 7) {
      return this.translate.instant('DATE.DAYS_AGO', { count: diffDays });
    }
    return date.toLocaleDateString();
  }

  onRemove(path: string, event: Event): void {
    event.stopPropagation();
    this.removeRecent.emit(path);
  }
}
