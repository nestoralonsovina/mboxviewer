import { Component, input, output } from '@angular/core';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { EmailItemComponent } from './email-item.component';
import type { EmailEntry } from '../../../core/models/mbox.models';

@Component({
  selector: 'app-email-list',
  standalone: true,
  imports: [SpinnerComponent, IconComponent, EmailItemComponent],
  templateUrl: './email-list.component.html',
  host: { class: 'block overflow-y-auto bg-white dark:bg-slate-900' },
})
export class EmailListComponent {
  readonly emails = input.required<readonly EmailEntry[]>();
  readonly selectedEmail = input<EmailEntry | null>(null);
  readonly isLoading = input(false);
  readonly searchQuery = input('');
  readonly selectedLabel = input<string | null>(null);

  readonly emailClick = output<EmailEntry>();

  isSelected(email: EmailEntry): boolean {
    const selected = this.selectedEmail();
    return selected !== null && selected.index === email.index;
  }

  onEmailClick(email: EmailEntry): void {
    this.emailClick.emit(email);
  }
}
