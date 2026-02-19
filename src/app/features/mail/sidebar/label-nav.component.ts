import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import type { LabelCount } from '../../../core/models/mbox.models';

@Component({
  selector: 'app-label-nav',
  standalone: true,
  imports: [DecimalPipe, IconComponent],
  template: `
    <nav class="sidebar-nav">
      <button
        class="nav-item"
        [class.active]="!selectedLabel() && !searchQuery()"
        (click)="labelClick.emit(null)">
        <app-icon name="activity" />
        All Mail
        <span class="nav-count">{{ totalMessages() | number }}</span>
      </button>

      @for (label of labels(); track label.label) {
        <button
          class="nav-item"
          [class.active]="selectedLabel() === label.label"
          (click)="labelClick.emit(label.label)">
          <app-icon name="tag" />
          {{ label.label }}
          <span class="nav-count">{{ label.count | number }}</span>
        </button>
      }
    </nav>
  `,
  styles: `
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.625rem 0.75rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      background: transparent;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      text-align: left;
      transition: all var(--transition);
    }

    .nav-item:hover {
      color: var(--text-primary);
      background: var(--bg-tertiary);
    }

    .nav-item.active {
      color: var(--accent-color);
      background: rgba(13, 110, 253, 0.1);
      font-weight: 500;
    }

    .nav-count {
      margin-left: auto;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  `,
})
export class LabelNavComponent {
  readonly labels = input.required<readonly LabelCount[]>();
  readonly selectedLabel = input.required<string | null>();
  readonly searchQuery = input.required<string>();
  readonly totalMessages = input.required<number>();

  readonly labelClick = output<string | null>();
}
