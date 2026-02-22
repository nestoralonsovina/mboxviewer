import { Component, input } from '@angular/core';
import { formatDate } from '../../../core/utils/format';
import type { EmailEntry } from '../../../core/models/mbox.models';

@Component({
  selector: 'app-email-meta',
  standalone: true,
  template: `
    @let email = this.email();
    <div class="flex items-start gap-4 mb-6">
      <!-- Avatar -->
      <div class="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-gradient-to-br from-accent to-accent-hover text-white shadow-sm">
        {{ (email.from_name || email.from_address).charAt(0).toUpperCase() }}
      </div>
      
      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-baseline gap-2 mb-1">
          <span class="text-base font-semibold text-surface-900 dark:text-surface-50">
            {{ email.from_name || email.from_address }}
          </span>
          @if (email.from_name) {
            <span class="text-sm text-surface-400 dark:text-surface-500 truncate">
              &lt;{{ email.from_address }}&gt;
            </span>
          }
        </div>
        
        <div class="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 mb-2">
          <span>{{ formattedDate() }}</span>
          @if (email.to.length > 0) {
            <span class="text-surface-300 dark:text-surface-600">•</span>
            <span class="truncate">
              To: 
              @for (to of email.to.slice(0, 2); track to.address; let last = $last) {
                {{ to.name || to.address }}@if (!last && email.to.length > 1) {, }
              }
              @if (email.to.length > 2) {
                <span class="text-surface-400">+{{ email.to.length - 2 }} more</span>
              }
            </span>
          }
        </div>
        
        @if (email.labels.length > 0) {
          <div class="flex flex-wrap gap-1.5">
            @for (label of email.labels; track label) {
              <span class="inline-block px-2 py-0.5 text-[11px] font-medium text-accent bg-accent/10 rounded">{{ label }}</span>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class EmailMetaComponent {
  readonly email = input.required<EmailEntry>();

  formattedDate(): string {
    return formatDate(this.email().date);
  }
}
