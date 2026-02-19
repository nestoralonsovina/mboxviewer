import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { SpinnerComponent } from './spinner.component';

@Component({
  standalone: true,
  imports: [SpinnerComponent],
  template: `<app-spinner [size]="spinnerSize" />`,
})
class TestHostComponent {
  spinnerSize = 16;
}

function getSpinnerDebugElement(fixture: ComponentFixture<TestHostComponent>): DebugElement {
  return fixture.debugElement.query(By.directive(SpinnerComponent));
}

function getSpinnerSpan(fixture: ComponentFixture<TestHostComponent>): HTMLElement {
  const debugEl = getSpinnerDebugElement(fixture);
  const el: unknown = debugEl.nativeElement;
  if (!(el instanceof HTMLElement)) {
    throw new Error('Expected nativeElement to be an HTMLElement');
  }
  const span = el.querySelector('.spinner');
  if (!(span instanceof HTMLElement)) {
    throw new Error('Expected .spinner span to be an HTMLElement');
  }
  return span;
}

describe('SpinnerComponent', () => {
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

  it('renders a spinner element', () => {
    const span = getSpinnerSpan(fixture);
    expect(span).toBeTruthy();
  });

  it('defaults to 16px size', () => {
    const span = getSpinnerSpan(fixture);
    expect(span.style.width).toBe('16px');
    expect(span.style.height).toBe('16px');
  });

  it('applies custom size from input', () => {
    host.spinnerSize = 24;
    fixture.detectChanges();

    const span = getSpinnerSpan(fixture);
    expect(span.style.width).toBe('24px');
    expect(span.style.height).toBe('24px');
  });

  it('updates size when input changes', () => {
    host.spinnerSize = 18;
    fixture.detectChanges();

    const span = getSpinnerSpan(fixture);
    expect(span.style.width).toBe('18px');
    expect(span.style.height).toBe('18px');

    host.spinnerSize = 32;
    fixture.detectChanges();

    expect(span.style.width).toBe('32px');
    expect(span.style.height).toBe('32px');
  });

  it('has role="status" for accessibility', () => {
    const span = getSpinnerSpan(fixture);
    expect(span.getAttribute('role')).toBe('status');
  });

  it('has aria-label for screen readers', () => {
    const span = getSpinnerSpan(fixture);
    expect(span.getAttribute('aria-label')).toBe('Loading');
  });
});
