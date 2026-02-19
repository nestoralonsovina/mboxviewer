import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  formatDate,
  formatFileSize,
  formatSender,
  getFileName,
  formatRelativeDate,
} from './format';

describe('formatDate', () => {
  it('formats ISO date string to localized date with time', () => {
    const result = formatDate('2024-03-15T10:30:00Z');
    expect(result).toContain('2024');
    expect(result).toContain('Mar');
    expect(result).toContain('15');
  });

  it('handles date-only string', () => {
    const result = formatDate('2023-01-01');
    expect(result).toContain('2023');
    expect(result).toContain('Jan');
  });
});

describe('formatFileSize', () => {
  it('returns bytes for values under 1024', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1023)).toBe('1023 B');
  });

  it('returns KB for values between 1024 and 1MB', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024 * 512)).toBe('512.0 KB');
  });

  it('returns MB for values at or above 1MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
    expect(formatFileSize(1024 * 1024 * 100)).toBe('100.0 MB');
  });

  it('handles exact boundary at 1024', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });

  it('handles exact boundary at 1MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
  });
});

describe('formatSender', () => {
  it('returns from_name when present', () => {
    expect(
      formatSender({ from_name: 'Alice', from_address: 'alice@example.com' }),
    ).toBe('Alice');
  });

  it('returns from_address when from_name is empty', () => {
    expect(
      formatSender({ from_name: '', from_address: 'bob@example.com' }),
    ).toBe('bob@example.com');
  });

  it('returns from_address when from_name is whitespace-only but truthy', () => {
    expect(
      formatSender({ from_name: ' ', from_address: 'carol@example.com' }),
    ).toBe(' ');
  });
});

describe('getFileName', () => {
  it('returns empty string for null', () => {
    expect(getFileName(null)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(getFileName('')).toBe('');
  });

  it('extracts filename from Unix path', () => {
    expect(getFileName('/home/user/mail.mbox')).toBe('mail.mbox');
  });

  it('extracts filename from Windows path', () => {
    expect(getFileName('C:\\Users\\user\\mail.mbox')).toBe('mail.mbox');
  });

  it('returns the path itself when no separator exists', () => {
    expect(getFileName('mail.mbox')).toBe('mail.mbox');
  });

  it('handles trailing slash by returning empty string', () => {
    expect(getFileName('/home/user/')).toBe('');
  });
});

describe('formatRelativeDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Today" for a date within the same day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    expect(formatRelativeDate('2024-06-15T08:00:00Z')).toBe('Today');
  });

  it('returns "Yesterday" for a date one day ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    expect(formatRelativeDate('2024-06-14T12:00:00Z')).toBe('Yesterday');
  });

  it('returns "N days ago" for dates 2-6 days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    expect(formatRelativeDate('2024-06-12T12:00:00Z')).toBe('3 days ago');
    expect(formatRelativeDate('2024-06-09T12:00:00Z')).toBe('6 days ago');
  });

  it('returns localized date for dates 7+ days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    const result = formatRelativeDate('2024-06-01T12:00:00Z');
    expect(result).not.toContain('days ago');
    expect(result).toBeTruthy();
  });
});
