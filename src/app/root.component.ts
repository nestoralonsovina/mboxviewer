import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { WindowService } from './core/services/window.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  host: {
    class: 'block h-screen overflow-hidden font-sans text-slate-900 dark:text-slate-50 bg-slate-50 dark:bg-slate-900',
  },
})
export class RootComponent implements OnInit, OnDestroy {
  private readonly windowService = inject(WindowService);
  private unlistenPreferences: UnlistenFn | null = null;

  async ngOnInit(): Promise<void> {
    console.log('[RootComponent] Setting up event listeners...');
    
    // Listen for the open-preferences event from the native menu
    this.unlistenPreferences = await listen('open-preferences', () => {
      console.log('[RootComponent] Received open-preferences event');
      void this.windowService.openPreferences();
    });
    
    console.log('[RootComponent] Event listeners ready');
  }

  ngOnDestroy(): void {
    if (this.unlistenPreferences) {
      this.unlistenPreferences();
    }
  }
}
