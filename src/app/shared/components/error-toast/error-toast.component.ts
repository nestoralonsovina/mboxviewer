import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-error-toast',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  template: `
    @let msg = message();
    @if (msg) {
      <div
        class="error-toast"
        role="alert"
        tabindex="0"
        (click)="dismissed.emit()"
        (keydown.enter)="dismissed.emit()">
        <div class="icon-wrapper">
          <app-icon name="alert-circle" [size]="18" />
        </div>
        <span class="message">{{ msg }}</span>
        <button class="btn-dismiss" type="button">{{ 'SHARED.DISMISS' | translate }}</button>
      </div>
    }
  `,
  styles: `
    .error-toast {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 1rem 1.25rem;
      background: oklch(0.25 0.02 17);
      color: white;
      border: 1px solid oklch(0.35 0.05 17);
      border-radius: 14px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2), 0 4px 10px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      z-index: 1000;
      animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      font-size: 0.875rem;
      font-weight: 500;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(1.5rem) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0) scale(1);
      }
    }

    .icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: oklch(0.586 0.209 17);
      border-radius: 8px;
      flex-shrink: 0;
    }

    .message {
      flex: 1;
      line-height: 1.4;
    }

    .btn-dismiss {
      padding: 0.375rem 0.875rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s ease;
      flex-shrink: 0;
    }

    .btn-dismiss:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  `,
})
export class ErrorToastComponent {
  readonly message = input<string | null>(null);
  readonly dismissed = output();
}
