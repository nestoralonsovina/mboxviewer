import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorToastComponent } from './error-toast.component';

@Component({
  standalone: true,
  imports: [ErrorToastComponent],
  template: `<app-error-toast [message]="errorMessage" (dismissed)="onDismissed()" />`,
})
class TestHostComponent {
  errorMessage: string | null = null;
  onDismissed = vi.fn();
}

function queryToast(fixture: ComponentFixture<TestHostComponent>): HTMLElement | null {
  const matches = fixture.debugElement.queryAll(By.css('.error-toast'));
  if (matches.length === 0) {
    return null;
  }
  const el: unknown = matches[0].nativeElement;
  if (!(el instanceof HTMLElement)) {
    throw new Error('Expected nativeElement to be an HTMLElement');
  }
  return el;
}

describe('ErrorToastComponent', () => {
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

  it('does not render when message is null', () => {
    const toast = queryToast(fixture);
    expect(toast).toBeNull();
  });

  it('renders toast when message is provided', () => {
    host.errorMessage = 'Something went wrong';
    fixture.detectChanges();

    const toast = queryToast(fixture);
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain('Something went wrong');
  });

  it('hides toast when message changes from string to null', () => {
    host.errorMessage = 'Error occurred';
    fixture.detectChanges();
    expect(queryToast(fixture)).not.toBeNull();

    host.errorMessage = null;
    fixture.detectChanges();
    expect(queryToast(fixture)).toBeNull();
  });

  it('emits dismissed when toast is clicked', () => {
    host.errorMessage = 'Click to dismiss';
    fixture.detectChanges();

    const toast = queryToast(fixture);
    expect(toast).not.toBeNull();
    toast?.click();

    expect(host.onDismissed).toHaveBeenCalledOnce();
  });

  it('emits dismissed when dismiss button is clicked', () => {
    host.errorMessage = 'Dismiss me';
    fixture.detectChanges();

    const dismissBtn = fixture.debugElement.query(By.css('.btn-dismiss'));
    expect(dismissBtn).not.toBeNull();

    const el: unknown = dismissBtn.nativeElement;
    if (!(el instanceof HTMLElement)) {
      throw new Error('Expected nativeElement to be an HTMLElement');
    }
    el.click();

    expect(host.onDismissed).toHaveBeenCalled();
  });

  it('has role="alert" for accessibility', () => {
    host.errorMessage = 'Accessible error';
    fixture.detectChanges();

    const toast = queryToast(fixture);
    expect(toast?.getAttribute('role')).toBe('alert');
  });

  it('displays updated message when input changes', () => {
    host.errorMessage = 'First error';
    fixture.detectChanges();
    expect(queryToast(fixture)?.textContent).toContain('First error');

    host.errorMessage = 'Second error';
    fixture.detectChanges();
    expect(queryToast(fixture)?.textContent).toContain('Second error');
  });

  it('renders dismiss button with text', () => {
    host.errorMessage = 'Error with button';
    fixture.detectChanges();

    const btn = fixture.debugElement.query(By.css('.btn-dismiss'));
    const el: unknown = btn.nativeElement;
    if (!(el instanceof HTMLElement)) {
      throw new Error('Expected nativeElement to be an HTMLElement');
    }
    expect(el.textContent?.trim()).toBe('Dismiss');
  });
});
