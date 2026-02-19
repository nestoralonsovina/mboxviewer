import { Component, input } from '@angular/core';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import type { EmailBody } from '../../../core/models/mbox.models';

@Component({
  selector: 'app-email-body',
  standalone: true,
  imports: [SpinnerComponent],
  template: `
    <div class="email-body">
      @let body = this.body();
      @if (isLoading() && !body) {
        <div class="loading-state">
          <app-spinner />
          Loading email content...
        </div>
      } @else if (body) {
        @if (body.html) {
          <iframe
            class="email-iframe"
            [srcdoc]="body.html"
            sandbox="allow-same-origin">
          </iframe>
        } @else if (body.text) {
          <pre class="email-text">{{ body.text }}</pre>
        } @else {
          <div class="empty-body">
            <p>No content available</p>
          </div>
        }
      } @else {
        <div class="empty-body">
          <p>No content available</p>
        </div>
      }
    </div>
  `,
  styleUrl: './email-body.component.css',
})
export class EmailBodyComponent {
  readonly body = input<EmailBody | null>(null);
  readonly isLoading = input(false);
}
