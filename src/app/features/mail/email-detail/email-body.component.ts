import { Component, input, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import type { EmailBody } from '../../../core/models/mbox.models';

@Component({
  selector: 'app-email-body',
  standalone: true,
  imports: [SpinnerComponent, TranslatePipe],
  host: { class: 'block' },
  template: `
    @let body = this.body();
    @if (isLoading() && !body) {
      <div class="flex flex-col items-center justify-center gap-3 p-12 text-surface-400 dark:text-surface-500">
        <app-spinner />
        <span class="text-sm">{{ 'EMAIL_DETAIL.LOADING' | translate }}</span>
      </div>
    } @else if (body) {
      @if (body.html) {
        <iframe
          #emailFrame
          class="w-full border-none bg-white block"
          [srcdoc]="getStyledHtml(body.html)"
          sandbox="allow-same-origin"
          [title]="'EMAIL_DETAIL.IFRAME_TITLE' | translate"
          (load)="onIframeLoad()">
        </iframe>
      } @else if (body.text) {
        <pre class="m-0 px-6 py-5 font-sans text-sm leading-relaxed whitespace-pre-wrap break-words text-surface-700 dark:text-surface-300">{{ body.text }}</pre>
      } @else {
        <div class="p-8 text-center text-surface-400 dark:text-surface-500 text-sm">
          {{ 'EMAIL_DETAIL.NO_CONTENT' | translate }}
        </div>
      }
    } @else {
      <div class="p-8 text-center text-surface-400 dark:text-surface-500 text-sm">
        {{ 'EMAIL_DETAIL.NO_CONTENT' | translate }}
      </div>
    }
  `,
})
export class EmailBodyComponent {
  @ViewChild('emailFrame') emailFrame?: ElementRef<HTMLIFrameElement>;
  
  readonly body = input<EmailBody | null>(null);
  readonly isLoading = input(false);

  onIframeLoad(): void {
    // Auto-resize iframe to fit content
    if (this.emailFrame?.nativeElement) {
      const iframe = this.emailFrame.nativeElement;
      try {
        const height = iframe.contentDocument?.body?.scrollHeight ?? 400;
        iframe.style.height = Math.max(height + 40, 200) + 'px';
      } catch {
        iframe.style.height = '500px';
      }
    }
  }

  getStyledHtml(html: string): string {
    const styles = `<style>
      html, body { 
        margin: 0; 
        padding: 24px; 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
        font-size: 14px; 
        line-height: 1.6; 
        color: #374151; 
        background: white;
        min-height: auto;
      }
      img { max-width: 100%; height: auto; }
      table { max-width: 100%; }
      pre, code { white-space: pre-wrap; word-wrap: break-word; }
      a { color: #D4726A; }
      blockquote { margin: 8px 0; padding-left: 12px; border-left: 3px solid #E5E7EB; color: #6B7280; }
    </style>`;
    
    if (html.includes('<head>')) {
      return html.replace('<head>', '<head>' + styles);
    }
    return styles + html;
  }
}
