import { describe, it, expect } from 'vitest';
import { getIconDefinition, isValidIconName } from './icon-registry';

describe('isValidIconName', () => {
  it('returns true for registered icon names', () => {
    expect(isValidIconName('mail')).toBe(true);
    expect(isValidIconName('close')).toBe(true);
    expect(isValidIconName('folder')).toBe(true);
    expect(isValidIconName('search')).toBe(true);
    expect(isValidIconName('attachment')).toBe(true);
    expect(isValidIconName('download')).toBe(true);
    expect(isValidIconName('file')).toBe(true);
    expect(isValidIconName('tag')).toBe(true);
    expect(isValidIconName('activity')).toBe(true);
    expect(isValidIconName('arrow-left')).toBe(true);
    expect(isValidIconName('alert-circle')).toBe(true);
  });

  it('returns false for unregistered names', () => {
    expect(isValidIconName('nonexistent')).toBe(false);
    expect(isValidIconName('')).toBe(false);
    expect(isValidIconName('MAIL')).toBe(false);
  });
});

describe('getIconDefinition', () => {
  it('returns definition with viewBox and paths for valid icon', () => {
    const definition = getIconDefinition('mail');
    expect(definition).toBeDefined();
    expect(definition?.viewBox).toBe('0 0 24 24');
    expect(definition?.paths.length).toBeGreaterThan(0);
  });

  it('returns undefined for invalid icon name', () => {
    expect(getIconDefinition('nonexistent')).toBeUndefined();
  });

  it('returns paths containing SVG elements for each icon', () => {
    const icons = [
      'mail', 'close', 'folder', 'search', 'attachment',
      'download', 'file', 'tag', 'activity', 'arrow-left', 'alert-circle',
    ];

    for (const icon of icons) {
      const definition = getIconDefinition(icon);
      expect(definition, `icon "${icon}" should be defined`).toBeDefined();
      expect(definition?.paths.length, `icon "${icon}" should have paths`).toBeGreaterThan(0);
      for (const path of definition?.paths ?? []) {
        expect(path, `path in "${icon}" should start with <`).toMatch(/^<\w+/);
      }
    }
  });

  it('returns correct path data for mail icon', () => {
    const definition = getIconDefinition('mail');
    expect(definition?.paths).toEqual([
      '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>',
      '<polyline points="22,6 12,13 2,6"/>',
    ]);
  });

  it('returns correct path data for close icon', () => {
    const definition = getIconDefinition('close');
    expect(definition?.paths).toEqual([
      '<line x1="18" y1="6" x2="6" y2="18"/>',
      '<line x1="6" y1="6" x2="18" y2="18"/>',
    ]);
  });
});
