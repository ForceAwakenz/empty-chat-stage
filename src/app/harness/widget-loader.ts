import { EMBEDDING_TARGET, HarnessSettings } from './harness-settings';

declare global {
  interface Window {
    sp?: {
      liveChat?: {
        config(options: Record<string, unknown>): void;
        open?(): void;
        close?(): void;
        toggle?(): void;
      };
    };
    oSpP?: Record<string, string>;
  }
}

export function loadWidget(settings: HarnessSettings): void {
  document.addEventListener('spLiveChatLoaded', () => {
    window.sp?.liveChat?.config({
      primaryColor: '#f3038a',
      colorScheme: settings.colorScheme,
      chatPosition: { bottom: '20px' },
      language: 'en',
      autoOpen: settings.autoOpen,
    });
  });

  window.oSpP = {
    phone: '+380991112233',
    email: 'username@example.com',
    name: 'Olga',
    city: 'Odessa',
  };

  const script = document.createElement('script');
  script.src = settings.loaderSrc;
  script.async = true;
  script.dataset['liveChatId'] = settings.botId;
  script.dataset['isEmbedded'] = String(settings.isEmbedded);
  if (settings.isEmbedded) script.dataset['embeddingTarget'] = EMBEDDING_TARGET;

  document.body.appendChild(script);
}
