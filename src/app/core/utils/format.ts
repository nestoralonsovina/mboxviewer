interface SenderFields {
  readonly from_name: string;
  readonly from_address: string;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatSender(email: SenderFields): string {
  if (email.from_name) {
    return email.from_name;
  }
  return email.from_address;
}

export function getFileName(path: string | null): string {
  if (!path) return '';
  const afterForwardSlash = path.split('/').pop() ?? path;
  return afterForwardSlash.split('\\').pop() ?? afterForwardSlash;
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${String(diffDays)} days ago`;
  }
  return date.toLocaleDateString();
}
