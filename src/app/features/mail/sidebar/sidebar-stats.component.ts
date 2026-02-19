import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { MboxStats } from '../../../core/models/mbox.models';

@Component({
  selector: 'app-sidebar-stats',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    @let s = stats();
    @if (s) {
      <div class="sidebar-stats">
        <div class="stat">
          <span class="stat-value">{{ s.total_messages | number }}</span>
          <span class="stat-label">emails</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ s.total_with_attachments | number }}</span>
          <span class="stat-label">with attachments</span>
        </div>
      </div>
    }
  `,
  styles: `
    .sidebar-stats {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
    }

    .stat {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
  `,
})
export class SidebarStatsComponent {
  readonly stats = input.required<MboxStats | null>();
}
