import { Injectable } from '@angular/core';
import { WebviewWindow, getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

@Injectable({
  providedIn: 'root',
})
export class WindowService {
  private preferencesWindow: WebviewWindow | null = null;

  async openPreferences(): Promise<void> {
    console.log('[WindowService] openPreferences called');
    
    // Don't open preferences if we're already in the preferences window
    const currentWindow = getCurrentWebviewWindow();
    console.log('[WindowService] Current window label:', currentWindow.label);
    
    if (currentWindow.label === 'preferences') {
      console.log('[WindowService] Already in preferences window, skipping');
      return;
    }

    // Check if window already exists and try to focus it
    const existing = await WebviewWindow.getByLabel('preferences');
    console.log('[WindowService] Existing preferences window:', existing);
    
    if (existing) {
      try {
        console.log('[WindowService] Focusing existing window');
        await existing.setFocus();
        this.preferencesWindow = existing;
        return;
      } catch (err) {
        console.log('[WindowService] Could not focus existing window:', err);
        // Window doesn't exist anymore
      }
    }

    try {
      console.log('[WindowService] Creating new preferences window');
      
      // Create new preferences window
      this.preferencesWindow = new WebviewWindow('preferences', {
        url: '/preferences',
        title: 'Preferences',
        width: 480,
        height: 560,
        minWidth: 400,
        minHeight: 400,
        resizable: true,
        center: true,
        decorations: true,
        transparent: false,
        focus: true,
      });

      console.log('[WindowService] WebviewWindow created:', this.preferencesWindow);

      // Listen for successful creation
      this.preferencesWindow.once('tauri://created', () => {
        console.log('[WindowService] Preferences window created successfully');
      });

      // Listen for errors during creation
      this.preferencesWindow.once('tauri://error', (e) => {
        console.error('[WindowService] Failed to create preferences window:', e);
        this.preferencesWindow = null;
      });

      // Clean up reference when window is closed
      this.preferencesWindow.once('tauri://destroyed', () => {
        console.log('[WindowService] Preferences window destroyed');
        this.preferencesWindow = null;
      });
    } catch (err) {
      console.error('[WindowService] Error creating preferences window:', err);
    }
  }

  async closePreferences(): Promise<void> {
    if (this.preferencesWindow) {
      try {
        await this.preferencesWindow.close();
      } catch {
        // Window already closed
      }
      this.preferencesWindow = null;
    }
  }
}
