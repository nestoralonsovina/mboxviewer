import { Component, input, output, signal, computed } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

interface SearchFields {
  from: string;
  to: string;
  subject: string;
  body: string;
  hasAttachment: boolean;
}

@Component({
  selector: 'app-search-toolbar',
  standalone: true,
  imports: [IconComponent, SpinnerComponent, TranslatePipe],
  templateUrl: './search-toolbar.component.html',
})
export class SearchToolbarComponent {
  readonly isSearching = input.required<boolean>();
  readonly searchResultsCount = input.required<number | null>();
  readonly emailCount = input.required<number>();

  readonly searchChange = output<string>();
  readonly clearSearch = output();

  readonly searchValue = signal('');
  readonly advancedOpen = signal(false);
  readonly searchFields = signal<SearchFields>({
    from: '',
    to: '',
    subject: '',
    body: '',
    hasAttachment: false,
  });

  readonly hasAdvancedFilters = computed(() => {
    const fields = this.searchFields();
    return (
      fields.from !== '' ||
      fields.to !== '' ||
      fields.subject !== '' ||
      fields.body !== '' ||
      fields.hasAttachment
    );
  });

  readonly activeFilterCount = computed(() => {
    const fields = this.searchFields();
    let count = 0;
    if (fields.from) count++;
    if (fields.to) count++;
    if (fields.subject) count++;
    if (fields.body) count++;
    if (fields.hasAttachment) count++;
    return count;
  });

  /** Content search requires at least one other filter to avoid slow full scans */
  readonly canSearchContent = computed(() => {
    const fields = this.searchFields();
    return (
      fields.from !== '' ||
      fields.to !== '' ||
      fields.subject !== '' ||
      fields.hasAttachment ||
      this.searchValue().trim() !== ''
    );
  });

  onSearchInput(value: string): void {
    this.searchValue.set(value);
    this.emitCombinedQuery();
  }

  onClearSearch(): void {
    this.searchValue.set('');
    this.searchFields.set({
      from: '',
      to: '',
      subject: '',
      body: '',
      hasAttachment: false,
    });
    this.clearSearch.emit();
  }

  toggleAdvanced(): void {
    this.advancedOpen.update((v) => !v);
  }

  onFieldChange(field: keyof SearchFields, value: string | boolean): void {
    this.searchFields.update((fields) => {
      const updated = { ...fields, [field]: value };
      
      // Clear body if no other filters remain (body requires pre-filtering)
      if (field !== 'body' && updated.body) {
        const hasOtherFilters =
          updated.from !== '' ||
          updated.to !== '' ||
          updated.subject !== '' ||
          updated.hasAttachment ||
          this.searchValue().trim() !== '';
        
        if (!hasOtherFilters) {
          updated.body = '';
        }
      }
      
      return updated;
    });
    this.emitCombinedQuery();
  }

  private emitCombinedQuery(): void {
    const parts: string[] = [];
    const fields = this.searchFields();

    if (fields.from) {
      parts.push(`from:${this.quoteIfNeeded(fields.from)}`);
    }
    if (fields.to) {
      parts.push(`to:${this.quoteIfNeeded(fields.to)}`);
    }
    if (fields.subject) {
      parts.push(`subject:${this.quoteIfNeeded(fields.subject)}`);
    }
    if (fields.body) {
      parts.push(`body:${this.quoteIfNeeded(fields.body)}`);
    }
    if (fields.hasAttachment) {
      parts.push('has:attachment');
    }

    // Add free-text search at the end
    const freeText = this.searchValue().trim();
    if (freeText) {
      parts.push(freeText);
    }

    this.searchChange.emit(parts.join(' '));
  }

  private quoteIfNeeded(value: string): string {
    // Quote if contains spaces
    if (value.includes(' ')) {
      return `"${value}"`;
    }
    return value;
  }
}
