export type ColorScheme = 'auto' | 'light' | 'dark';

export interface HarnessSettings {
  loaderSrc: string;
  botId: string;
  isEmbedded: boolean;
  colorScheme: ColorScheme;
  autoOpen: boolean;
  simulateMobile: boolean;
  blockSessionStorage: boolean;
}

export const LOADER_PRESETS = [
  { label: 'Prod CDN', src: 'https://cdn.pulse.is/livechat/loader.js' },
  { label: 'Stage S3', src: 'https://s3.eu-central-1.amazonaws.com/live-chat.sendpulse.stage/loader.js' },
  { label: 'Local dev (yarn dev, :8000)', src: 'http://localhost:8000/loader.js' },
];

export const EMBEDDING_TARGET = '#live-chat-target';

// Not prefixed with "sp" so the "reset visitor" action never wipes it.
const SETTINGS_KEY = 'chatStage.settings';

const DEFAULT_SETTINGS: HarnessSettings = {
  loaderSrc: LOADER_PRESETS[0].src,
  botId: '6799fd819ed45592f60a8dff',
  isEmbedded: false,
  colorScheme: 'dark',
  autoOpen: false,
  simulateMobile: false,
  blockSessionStorage: false,
};

export function loadSettings(): HarnessSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** The widget reads settings only at load, so every change needs a full reload. */
export function applySettingsAndReload(patch: Partial<HarnessSettings>): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...loadSettings(), ...patch }));
  location.reload();
}
