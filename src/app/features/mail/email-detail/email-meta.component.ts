import { Component, input } from '@angular/core';
import { formatDate } from '../../../core/utils/format';
import type { EmailEntry } from '../../../core/models/mbox.models';

@Component({
  selector: 'app-email-meta',
  standalone: true,
  template: `
    @let email = this.email();
    <div class="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-4">
      <div class="flex gap-3 text-sm">
        <span class="shrink-0 w-15 text-slate-500">From:</span>
        <span class="text-slate-900 dark:text-slate-50 break-words">
          @if (email.from_name) {
            {{ email.from_name }} &lt;{{ email.from_address }}&gt;
          } @else {
            {{ email.from_address }}
          }
        </span>
      </div>
      @if (email.to.length > 0) {
        <div class="flex gap-3 text-sm">
          <span class="shrink-0 w-15 text-slate-500">To:</span>
          <span class="text-slate-900 dark:text-slate-50 break-words">
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
      <div class="flex gap-3 text-sm">
        <span class="shrink-0 w-15 text-slate-500">Date:</span>
        <span class="text-slate-900 dark:text-slate-50 break-words">{{ formattedDate() }}</span>
      </div>
      @if (email.labels.length > 0) {
        <div class="flex gap-3 text-sm">
          <span class="shrink-0 w-15 text-slate-500">Labels:</span>
          <span class="flex flex-wrap gap-1.5">
            @for (label of email.labels; track label) {
              <span class="inline-block px-2 py-0.5 text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">{{ label }}</span>
            }
          </span>
        </div>
      }
    </div>
  `,
})
export class EmailMetaComponent {
  readonly email = input.required<EmailEntry>();

  formattedDate(): string {
    return formatDate(this.email().date);
  }
}
