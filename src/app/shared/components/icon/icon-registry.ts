interface IconDefinition {
  readonly viewBox: string;
  readonly paths: readonly string[];
}

const ICON_DEFINITIONS: Readonly<Record<string, IconDefinition>> = {
  mail: {
    viewBox: '0 0 24 24',
    paths: [
      '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>',
      '<polyline points="22,6 12,13 2,6"/>',
    ],
  },
  close: {
    viewBox: '0 0 24 24',
    paths: [
      '<line x1="18" y1="6" x2="6" y2="18"/>',
      '<line x1="6" y1="6" x2="18" y2="18"/>',
    ],
  },
  folder: {
    viewBox: '0 0 24 24',
    paths: [
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    ],
  },
  search: {
    viewBox: '0 0 24 24',
    paths: [
      '<circle cx="11" cy="11" r="8"/>',
      '<line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    ],
  },
  attachment: {
    viewBox: '0 0 24 24',
    paths: [
      '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    ],
  },
  download: {
    viewBox: '0 0 24 24',
    paths: [
      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
      '<polyline points="7 10 12 15 17 10"/>',
      '<line x1="12" y1="15" x2="12" y2="3"/>',
    ],
  },
  file: {
    viewBox: '0 0 24 24',
    paths: [
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>',
      '<polyline points="14 2 14 8 20 8"/>',
    ],
  },
  tag: {
    viewBox: '0 0 24 24',
    paths: [
      '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>',
      '<line x1="7" y1="7" x2="7.01" y2="7"/>',
    ],
  },
  activity: {
    viewBox: '0 0 24 24',
    paths: [
      '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    ],
  },
  'arrow-left': {
    viewBox: '0 0 24 24',
    paths: [
      '<line x1="19" y1="12" x2="5" y2="12"/>',
      '<polyline points="12 19 5 12 12 5"/>',
    ],
  },
  'alert-circle': {
    viewBox: '0 0 24 24',
    paths: [
      '<circle cx="12" cy="12" r="10"/>',
      '<line x1="12" y1="8" x2="12" y2="12"/>',
      '<line x1="12" y1="16" x2="12.01" y2="16"/>',
    ],
  },
  'chevron-left': {
    viewBox: '0 0 24 24',
    paths: [
      '<polyline points="15 18 9 12 15 6"/>',
    ],
  },
  'chevron-right': {
    viewBox: '0 0 24 24',
    paths: [
      '<polyline points="9 18 15 12 9 6"/>',
    ],
  },
  'panel-left': {
    viewBox: '0 0 24 24',
    paths: [
      '<rect width="18" height="18" x="3" y="3" rx="2"/>',
      '<path d="M9 3v18"/>',
    ],
  },
  'menu': {
    viewBox: '0 0 24 24',
    paths: [
      '<line x1="4" y1="12" x2="20" y2="12"/>',
      '<line x1="4" y1="6" x2="20" y2="6"/>',
      '<line x1="4" y1="18" x2="20" y2="18"/>',
    ],
  },
  'chevron-down': {
    viewBox: '0 0 24 24',
    paths: [
      '<polyline points="6 9 12 15 18 9"/>',
    ],
  },
  'chevron-up': {
    viewBox: '0 0 24 24',
    paths: [
      '<polyline points="18 15 12 9 6 15"/>',
    ],
  },
  'sliders': {
    viewBox: '0 0 24 24',
    paths: [
      '<line x1="4" y1="21" x2="4" y2="14"/>',
      '<line x1="4" y1="10" x2="4" y2="3"/>',
      '<line x1="12" y1="21" x2="12" y2="12"/>',
      '<line x1="12" y1="8" x2="12" y2="3"/>',
      '<line x1="20" y1="21" x2="20" y2="16"/>',
      '<line x1="20" y1="12" x2="20" y2="3"/>',
      '<line x1="1" y1="14" x2="7" y2="14"/>',
      '<line x1="9" y1="8" x2="15" y2="8"/>',
      '<line x1="17" y1="16" x2="23" y2="16"/>',
    ],
  },
};

type IconName = keyof typeof ICON_DEFINITIONS;

const VALID_ICON_NAMES = new Set<string>(Object.keys(ICON_DEFINITIONS));

function isValidIconName(name: string): name is IconName {
  return VALID_ICON_NAMES.has(name);
}

function getIconDefinition(name: string): IconDefinition | undefined {
  if (isValidIconName(name)) {
    return ICON_DEFINITIONS[name];
  }
  return undefined;
}

export { type IconName, type IconDefinition, getIconDefinition, isValidIconName };
