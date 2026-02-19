import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import type {
  EmailBody,
  EmailEntry,
  LabelCount,
  MboxStats,
  SearchResults,
} from '../models/mbox.models';

@Injectable({
  providedIn: 'root',
})
export class MboxApiService {
  async openMbox(path: string): Promise<MboxStats> {
    return invoke<MboxStats>('open_mbox', { path });
  }

  async getEmails(offset: number, limit: number): Promise<EmailEntry[]> {
    return invoke<EmailEntry[]>('get_emails', { offset, limit });
  }

  async getEmailCount(): Promise<number> {
    return invoke<number>('get_email_count');
  }

  async getEmailBody(index: number): Promise<EmailBody> {
    return invoke<EmailBody>('get_email_body', { index });
  }

  async searchEmails(query: string, limit: number): Promise<SearchResults> {
    return invoke<SearchResults>('search_emails', { query, limit });
  }

  async getEmailsByLabel(label: string): Promise<EmailEntry[]> {
    return invoke<EmailEntry[]>('get_emails_by_label', { label });
  }

  async getAttachment(
    emailIndex: number,
    attachmentIndex: number,
  ): Promise<number[]> {
    return invoke<number[]>('get_attachment', {
      emailIndex,
      attachmentIndex,
    });
  }

  async getLabels(): Promise<LabelCount[]> {
    return invoke<LabelCount[]>('get_labels');
  }

  async closeMbox(): Promise<void> {
    await invoke('close_mbox');
  }
}
