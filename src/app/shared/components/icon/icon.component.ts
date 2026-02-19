import {
  Component,
  computed,
  input,
  inject,
} from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { getIconDefinition, type IconName } from './icon-registry';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    @let svg = svgContent();
    @if (svg) {
      <span
        class="icon"
        [innerHTML]="svg"
        aria-hidden="true">
      </span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }

    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(16);
  readonly strokeWidth = input(2);

  private readonly sanitizer = inject(DomSanitizer);

  readonly svgContent = computed<SafeHtml | null>(() => {
    const definition = getIconDefinition(this.name());
    if (!definition) {
      return null;
    }

    const sizeValue = String(this.size());
    const strokeValue = String(this.strokeWidth());
    const svgMarkup = [
      `<svg xmlns="http://www.w3.org/2000/svg"`,
      ` width="${sizeValue}"`,
      ` height="${sizeValue}"`,
      ` viewBox="${definition.viewBox}"`,
      ` fill="none"`,
      ` stroke="currentColor"`,
      ` stroke-width="${strokeValue}"`,
      ` stroke-linecap="round"`,
      ` stroke-linejoin="round">`,
      ...definition.paths,
      `</svg>`,
    ].join('');

    return this.sanitizer.bypassSecurityTrustHtml(svgMarkup);
  });
}
