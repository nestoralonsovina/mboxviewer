import { Component, input, output, signal } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-search-toolbar',
  standalone: true,
  imports: [IconComponent, SpinnerComponent],
  templateUrl: './search-toolbar.component.html',
})
export class SearchToolbarComponent {
  readonly isSearching = input.required<boolean>();
  readonly searchResultsCount = input.required<number | null>();
  readonly emailCount = input.required<number>();

  readonly searchChange = output<string>();
  readonly clearSearch = output();

  readonly searchValue = signal('');

  onSearchInput(value: string): void {
    this.searchValue.set(value);
    this.searchChange.emit(value);
  }

  onClearSearch(): void {
    this.searchValue.set('');
    this.clearSearch.emit();
  }
}
