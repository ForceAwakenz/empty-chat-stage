import { Injectable, OnDestroy, signal } from '@angular/core';
import { WidgetHooks } from './widget-hooks';

export interface MenuLink {
  text: string;
  href: string;
}

export interface WidgetSnapshot {
  isLoaded: boolean;
  messageCount: number | null;
  menuLinks: MenuLink[];
  storage: Record<string, string>;
}

const LOCAL_KEYS = ['spSubscriberId', 'spLiveChatOpened', 'spToastClosed'];
const SESSION_KEYS = ['spLiveChatAutoOpenShown'];

/** Reads widget state from its shadow DOM and storage once per second. */
@Injectable({ providedIn: 'root' })
export class WidgetInspector implements OnDestroy {
  readonly snapshot = signal<WidgetSnapshot>(this.read());

  private readonly timer = setInterval(() => this.snapshot.set(this.read()), 1000);

  constructor(private readonly hooks: WidgetHooks) {}

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  callApi(method: 'open' | 'close' | 'toggle'): void {
    const fn = window.sp?.liveChat?.[method];
    if (!fn) {
      this.hooks.log(`sp.liveChat.${method}() missing: this widget build has no JS API`);
      return;
    }
    fn();
    this.hooks.log(`Called sp.liveChat.${method}()`);
  }

  resetVisitor(): void {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('sp'))
      .forEach((key) => localStorage.removeItem(key));
    this.clearSessionFlag();
    location.reload();
  }

  removeStorageItem(area: 'local' | 'session', key: string): void {
    try {
      (area === 'local' ? localStorage : sessionStorage).removeItem(key);
      this.hooks.log(`Removed ${area}Storage.${key}`);
    } catch (error) {
      this.hooks.log(`Cannot remove ${key}: ${error}`);
    }
    this.snapshot.set(this.read());
  }

  clearSessionFlag(): void {
    this.removeStorageItem('session', 'spLiveChatAutoOpenShown');
  }

  private read(): WidgetSnapshot {
    const root = document.querySelector('sp-live-chat')?.shadowRoot;
    const messages = root?.querySelectorAll('.widget-chat-message');
    const anchors = Array.from(root?.querySelectorAll<HTMLAnchorElement>('.widget-icebreakers a') ?? []);

    return {
      isLoaded: !!root,
      messageCount: messages ? messages.length : null,
      menuLinks: uniqueLinks(
        anchors.map((a) => ({ text: a.textContent?.trim() ?? '', href: a.getAttribute('href') ?? '' })),
      ),
      storage: {
        ...Object.fromEntries(LOCAL_KEYS.map((key) => [`local.${key}`, readStorage(() => localStorage, key)])),
        ...Object.fromEntries(SESSION_KEYS.map((key) => [`session.${key}`, readStorage(() => sessionStorage, key)])),
      },
    };
  }
}

// The widget renders the same menu in the greeting and in the chat body.
function uniqueLinks(links: MenuLink[]): MenuLink[] {
  return links.filter((link, index) => links.findIndex((other) => other.href === link.href) === index);
}

function readStorage(area: () => Storage, key: string): string {
  try {
    return area().getItem(key) ?? '—';
  } catch {
    return 'blocked';
  }
}
