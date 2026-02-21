import { Component, input } from '@angular/core';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import type { EmailBody } from '../../../core/models/mbox.models';

@Component({
  selector: 'app-email-body',
  standalone: true,
  imports: [SpinnerComponent],
  template: `
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      @let body = this.body();
      @if (isLoading() && !body) {
        <div class="flex flex-col items-center justify-center gap-4 p-12 text-slate-400 dark:text-slate-500">
          <app-spinner />
          Loading email content...
        </div>
      } @else if (body) {
        @if (body.html) {
          <iframe
            class="w-full min-h-[400px] border-none bg-white dark:bg-slate-900"
            [srcdoc]="body.html"
            sandbox="allow-same-origin">
          </iframe>
        } @else if (body.text) {
          <pre class="m-0 p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap break-words">{{ body.text }}</pre>
        } @else {
          <div class="p-8 text-center text-slate-400 dark:text-slate-500">
            <p>No content available</p>
          </div>
        }
      } @else {
        <div class="p-8 text-center text-slate-400 dark:text-slate-500">
          <p>No content available</p>
        </div>
      }
    </div>
  `,
})
export class EmailBodyComponent {
  readonly body = input<EmailBody | null>(null);
  readonly isLoading = input(false);
}
