import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { formatDate, formatSender } from '../../../core/utils/format';
import type { EmailEntry } from '../../../core/models/mbox.models';

@Component({
  selector: 'app-email-item',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  templateUrl: './email-item.component.html',
  host: { class: 'block' },
})
export class EmailItemComponent {
  readonly email = input.required<EmailEntry>();
  readonly selected = input(false);

  readonly emailClick = output<EmailEntry>();

  get senderDisplay(): string {
    return formatSender(this.email());
  }

  get dateDisplay(): string {
    return formatDate(this.email().date);
  }

  onClick(): void {
    this.emailClick.emit(this.email());
  }
}
