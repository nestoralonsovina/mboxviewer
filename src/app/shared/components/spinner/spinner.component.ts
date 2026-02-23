import { Component, inject, input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `
    <span
      class="spinner"
      [style.width.px]="size()"
      [style.height.px]="size()"
      role="status"
      [attr.aria-label]="ariaLabel">
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      color: oklch(0.65 0.18 25); /* accent color */
    }

    .spinner {
      display: inline-block;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class SpinnerComponent {
  private readonly translate = inject(TranslateService);
  
  readonly size = input(18);

  get ariaLabel(): string {
    return this.translate.instant('SHARED.LOADING');
  }
}
