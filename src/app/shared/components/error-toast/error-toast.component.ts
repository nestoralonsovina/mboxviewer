import { Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-error-toast',
  standalone: true,
  imports: [IconComponent],
  template: `
    @let msg = message();
    @if (msg) {
      <div
        class="error-toast"
        role="alert"
        tabindex="0"
        (click)="dismissed.emit()"
        (keydown.enter)="dismissed.emit()">
        <app-icon name="alert-circle" [size]="20" />
        {{ msg }}
        <button class="btn-dismiss" type="button">Dismiss</button>
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
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      background: var(--danger-color);
      color: white;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      cursor: pointer;
      z-index: 1000;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(1rem);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }

    .btn-dismiss {
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      color: white;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }

    .btn-dismiss:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `,
})
export class ErrorToastComponent {
  readonly message = input<string | null>(null);
  readonly dismissed = output();
}
