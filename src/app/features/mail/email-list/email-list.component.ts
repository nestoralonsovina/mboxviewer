import { Component, ElementRef, input, output, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { EmailItemComponent } from './email-item.component';
import type { EmailEntry } from '../../../core/models/mbox.models';

@Component({
  selector: 'app-email-list',
  standalone: true,
  imports: [SpinnerComponent, IconComponent, EmailItemComponent],
  templateUrl: './email-list.component.html',
  host: { class: 'block overflow-y-auto bg-white dark:bg-surface-900' },
})
export class EmailListComponent implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private scrollListener: (() => void) | null = null;

  readonly emails = input.required<readonly EmailEntry[]>();
  readonly selectedEmail = input<EmailEntry | null>(null);
  readonly isLoading = input(false);
  readonly isLoadingMore = input(false);
  readonly hasMore = input(false);
  readonly searchQuery = input('');
  readonly selectedLabel = input<string | null>(null);

  readonly emailClick = output<EmailEntry>();
  readonly loadMore = output<void>();

  ngAfterViewInit(): void {
    const element = this.elementRef.nativeElement as HTMLElement;
    this.scrollListener = this.onScroll.bind(this);
    element.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  ngOnDestroy(): void {
    if (this.scrollListener) {
      const element = this.elementRef.nativeElement as HTMLElement;
      element.removeEventListener('scroll', this.scrollListener);
    }
  }

  private onScroll(): void {
    if (!this.hasMore() || this.isLoadingMore()) {
      return;
    }

    const element = this.elementRef.nativeElement as HTMLElement;
    const threshold = 200;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

    if (distanceFromBottom < threshold) {
      this.loadMore.emit();
    }
  }

  isSelected(email: EmailEntry): boolean {
    const selected = this.selectedEmail();
    return selected !== null && selected.index === email.index;
  }

  onEmailClick(email: EmailEntry): void {
    this.emailClick.emit(email);
  }
}
