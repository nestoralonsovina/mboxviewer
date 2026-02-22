import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UiStateService {
  private readonly _sidebarCollapsed = signal(true);

  readonly sidebarCollapsed = this._sidebarCollapsed.asReadonly();

  toggleSidebar(): void {
    this._sidebarCollapsed.update((collapsed) => !collapsed);
  }

  collapseSidebar(): void {
    this._sidebarCollapsed.set(true);
  }

  expandSidebar(): void {
    this._sidebarCollapsed.set(false);
  }
}
