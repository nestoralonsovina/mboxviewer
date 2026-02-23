import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { RecentFilesListComponent } from './recent-files-list.component';
import type { RecentFile } from '../../core/models/mbox.models';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [IconComponent, SpinnerComponent, RecentFilesListComponent, TranslatePipe],
  templateUrl: './welcome.component.html',
})
export class WelcomeComponent {
  readonly recentFiles = input.required<readonly RecentFile[]>();
  readonly isLoading = input.required<boolean>();

  readonly openFile = output();
  readonly openRecent = output<string>();
  readonly removeRecent = output<string>();
  readonly openPreferences = output();
}
