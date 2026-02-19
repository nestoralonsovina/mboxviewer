export interface RecentFile {
  readonly path: string;
  readonly name: string;
  readonly lastOpened: string;
}

export interface EmailAddress {
  readonly name: string;
  readonly address: string;
}

export interface EmailEntry {
  readonly index: number;
  readonly offset: number;
  readonly length: number;
  readonly date: string;
  readonly from_name: string;
  readonly from_address: string;
  readonly to: readonly EmailAddress[];
  readonly cc: readonly EmailAddress[];
  readonly subject: string;
  readonly has_attachments: boolean;
  readonly labels: readonly string[];
}

export interface EmailBody {
  readonly text: string | null;
  readonly html: string | null;
  readonly raw_headers: string;
  readonly attachments: readonly AttachmentInfo[];
}

export interface AttachmentInfo {
  readonly filename: string;
  readonly content_type: string;
  readonly size: number;
  readonly part_index: number;
}

export interface LabelCount {
  readonly label: string;
  readonly count: number;
}

export interface MboxStats {
  readonly total_messages: number;
  readonly total_with_attachments: number;
  readonly labels: readonly LabelCount[];
}

export interface SearchResults {
  readonly emails: readonly EmailEntry[];
  readonly total_count: number;
}
