import { Component, input } from '@angular/core';
import { formatDate } from '../../../core/utils/format';
import type { EmailEntry } from '../../../core/models/mbox.models';

@Component({
  selector: 'app-email-meta',
  standalone: true,
  template: `
    @let email = this.email();
    <div class="detail-meta">
      <div class="meta-row">
        <span class="meta-label">From:</span>
        <span class="meta-value">
          @if (email.from_name) {
            {{ email.from_name }} &lt;{{ email.from_address }}&gt;
          } @else {
            {{ email.from_address }}
          }
        </span>
      </div>
      @if (email.to.length > 0) {
        <div class="meta-row">
          <span class="meta-label">To:</span>
          <span class="meta-value">
            @for (to of email.to; track to.address; let last = $last) {
              @if (to.name) {
                {{ to.name }} &lt;{{ to.address }}&gt;
              } @else {
                {{ to.address }}
              }
              @if (!last) {, }
            }
          </span>
        </div>
      }
      <div class="meta-row">
        <span class="meta-label">Date:</span>
        <span class="meta-value">{{ formattedDate() }}</span>
      </div>
      @if (email.labels.length > 0) {
        <div class="meta-row">
          <span class="meta-label">Labels:</span>
          <span class="meta-value labels">
            @for (label of email.labels; track label) {
              <span class="label-tag">{{ label }}</span>
            }
          </span>
        </div>
      }
    </div>
  `,
  styleUrl: './email-meta.component.css',
})
export class EmailMetaComponent {
  readonly email = input.required<EmailEntry>();

  formattedDate(): string {
    return formatDate(this.email().date);
  }
}
