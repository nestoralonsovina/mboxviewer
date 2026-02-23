import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="relative">
      <button
        class="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 bg-transparent border border-surface-200 dark:border-surface-700 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        (click)="toggleOpen()">
        <app-icon name="globe" [size]="16" />
        <span>{{ currentLangLabel() }}</span>
        <app-icon [name]="isOpen() ? 'chevron-up' : 'chevron-down'" [size]="14" />
      </button>

      @if (isOpen()) {
        <div class="absolute bottom-full left-0 mb-1 w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg overflow-hidden z-50">
          @for (lang of languages; track lang.code) {
            <button
              class="w-full px-3 py-2 text-sm text-left transition-colors"
              [class]="currentLang() === lang.code
                ? 'bg-accent-subtle dark:bg-accent/20 text-accent font-medium'
                : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'"
              (click)="switchLanguage(lang.code)">
              {{ lang.label }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class LanguageSwitcherComponent {
  private readonly translate = inject(TranslateService);

  readonly languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
  ];

  readonly isOpen = signal(false);
  readonly currentLang = signal(this.translate.currentLang || 'en');

  currentLangLabel(): string {
    return this.languages.find((l) => l.code === this.currentLang())?.label ?? 'English';
  }

  toggleOpen(): void {
    this.isOpen.update((v) => !v);
  }

  switchLanguage(code: string): void {
    this.translate.use(code);
    this.currentLang.set(code);
    this.isOpen.set(false);
    localStorage.setItem('preferredLanguage', code);
  }
}
