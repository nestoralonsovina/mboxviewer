import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { IconComponent } from './icon.component';
import type { IconName } from './icon-registry';

@Component({
  standalone: true,
  imports: [IconComponent],
  template: `<app-icon [name]="iconName" [size]="iconSize" [strokeWidth]="iconStrokeWidth" />`,
})
class TestHostComponent {
  iconName: IconName = 'mail';
  iconSize = 16;
  iconStrokeWidth = 2;
}

function getIconDebugElement(fixture: ComponentFixture<TestHostComponent>): DebugElement {
  return fixture.debugElement.query(By.directive(IconComponent));
}

function getNativeElement(debugEl: DebugElement): HTMLElement {
  const el: unknown = debugEl.nativeElement;
  if (el instanceof HTMLElement) {
    return el;
  }
  throw new Error('Expected nativeElement to be an HTMLElement');
}

describe('IconComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function iconElement(): HTMLElement {
    return getNativeElement(getIconDebugElement(fixture));
  }

  it('renders an SVG element for a valid icon name', () => {
    const svg = iconElement().querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('sets width and height from size input', () => {
    host.iconSize = 24;
    fixture.detectChanges();

    const svg = iconElement().querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
  });

  it('sets stroke-width from strokeWidth input', () => {
    host.iconStrokeWidth = 1.5;
    fixture.detectChanges();

    const svg = iconElement().querySelector('svg');
    expect(svg?.getAttribute('stroke-width')).toBe('1.5');
  });

  it('defaults to size 16 and stroke-width 2', () => {
    const svg = iconElement().querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('16');
    expect(svg?.getAttribute('height')).toBe('16');
    expect(svg?.getAttribute('stroke-width')).toBe('2');
  });

  it('renders mail icon with path and polyline elements', () => {
    host.iconName = 'mail';
    fixture.detectChanges();

    const el = iconElement();
    expect(el.querySelectorAll('svg path').length).toBe(1);
    expect(el.querySelectorAll('svg polyline').length).toBe(1);
  });

  it('renders close icon with two line elements', () => {
    host.iconName = 'close';
    fixture.detectChanges();

    expect(iconElement().querySelectorAll('svg line').length).toBe(2);
  });

  it('sets aria-hidden on the icon span', () => {
    const span = iconElement().querySelector('.icon');
    expect(span?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders different icons when name changes', () => {
    host.iconName = 'search';
    fixture.detectChanges();
    expect(iconElement().querySelectorAll('svg circle').length).toBe(1);

    host.iconName = 'folder';
    fixture.detectChanges();
    expect(iconElement().querySelectorAll('svg path').length).toBe(1);
    expect(iconElement().querySelectorAll('svg circle').length).toBe(0);
  });
});
