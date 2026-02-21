import { Component, inject } from '@angular/core';
import { MboxStateService } from './state/mbox-state.service';
import { ErrorToastComponent } from './shared/components/error-toast/error-toast.component';
import { WelcomeComponent } from './features/welcome/welcome.component';
import { MailShellComponent } from './features/mail/mail-shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ErrorToastComponent, WelcomeComponent, MailShellComponent],
  templateUrl: './app.component.html',
  host: { class: 'block h-screen overflow-hidden font-sans text-slate-900 dark:text-slate-50 bg-slate-50 dark:bg-slate-900' },
})
export class AppComponent {
  protected readonly mbox = inject(MboxStateService);

  async onOpenFile(): Promise<void> {
    await this.mbox.openFile();
  }

  async onOpenRecentFile(path: string): Promise<void> {
    await this.mbox.loadMbox(path);
  }

  async onRemoveRecentFile(path: string): Promise<void> {
    await this.mbox.removeFromRecentFiles(path);
  }

  onDismissError(): void {
    this.mbox.clearError();
  }
}
