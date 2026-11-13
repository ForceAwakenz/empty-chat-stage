import { signal } from '@angular/core';
import { HarnessSettings } from './harness-settings';

export interface HarnessEvent {
  time: Date;
  text: string;
}

export interface HistoryRequest {
  time: Date;
  result: string;
}

const HISTORY_URL = /\/widget\/[^/]+\/[^/]+\/messages\?/;
const MOBILE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

export type HistoryFailure = 'network-error' | 'malformed-response';

/**
 * Patches browser APIs the widget uses, so test pages can break the network
 * on purpose. Must be installed before the widget bundle loads.
 */
export class WidgetHooks {
  readonly events = signal<HarnessEvent[]>([]);
  readonly sockets = signal<WebSocket[]>([]);
  readonly historyRequests = signal<HistoryRequest[]>([]);
  readonly offlineUntil = signal(0);
  readonly nextHistoryFailure = signal<HistoryFailure | null>(null);

  readonly sessionStorageBlocked: boolean;

  constructor(settings: HarnessSettings) {
    this.sessionStorageBlocked = settings.blockSessionStorage;

    this.patchWebSocket();
    this.patchFetch();
    if (settings.blockSessionStorage) this.blockSessionStorage();
    if (settings.simulateMobile) this.fakeMobileUserAgent();
  }

  log(text: string): void {
    this.events.update((events) => [{ time: new Date(), text }, ...events].slice(0, 200));
  }

  isOffline(): boolean {
    return Date.now() < this.offlineUntil();
  }

  goOffline(ms: number): void {
    this.offlineUntil.set(Date.now() + ms);
    this.log(`Offline for ${ms / 1000}s: WS and fetch fail`);
    this.closeSockets();
    setTimeout(() => this.log('Back online'), ms);
  }

  closeSockets(): void {
    const open = this.sockets().filter((ws) => ws.readyState <= WebSocket.OPEN);
    open.forEach((ws) => ws.close());
    this.log(`Closed ${open.length} socket(s) from harness`);
  }

  failNextHistoryRequest(failure: HistoryFailure): void {
    this.nextHistoryFailure.set(failure);
    this.log(`Next history request will fail: ${failure}`);
  }

  private patchWebSocket(): void {
    const hooks = this;
    const NativeWebSocket = window.WebSocket;

    class TrackedWebSocket extends NativeWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        hooks.trackSocket(this);
      }
    }

    window.WebSocket = TrackedWebSocket;
  }

  private trackSocket(ws: WebSocket): void {
    this.sockets.update((sockets) => [...sockets, ws]);
    this.log(`WS #${this.sockets().length} connecting`);
    const id = this.sockets().length;

    ws.addEventListener('open', () => this.log(`WS #${id} open`));
    ws.addEventListener('close', (event) => this.log(`WS #${id} closed (code ${event.code}); widget retries in 10s`));

    if (this.isOffline()) {
      this.log(`WS #${id} dropped: simulated offline`);
      ws.close();
    }
  }

  private patchFetch(): void {
    const nativeFetch = window.fetch.bind(window);

    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);

      if (this.isOffline()) {
        this.log(`fetch blocked (offline): ${url}`);
        return Promise.reject(new TypeError('Failed to fetch (simulated offline)'));
      }

      if (!HISTORY_URL.test(url)) return nativeFetch(input, init);

      return this.fetchHistory(url, () => nativeFetch(input, init));
    };
  }

  private fetchHistory(url: string, request: () => Promise<Response>): Promise<Response> {
    const failure = this.nextHistoryFailure();
    this.nextHistoryFailure.set(null);

    if (failure === 'network-error') {
      this.recordHistory('simulated network error');
      return Promise.reject(new TypeError('Failed to fetch (simulated)'));
    }
    if (failure === 'malformed-response') {
      this.recordHistory('simulated malformed 200 {}');
      return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }

    return request().then(
      (response) => {
        response
          .clone()
          .json()
          .then((body) => this.recordHistory(`HTTP ${response.status}, ${body?.data?.list?.length ?? '?'} messages`))
          .catch(() => this.recordHistory(`HTTP ${response.status}, unreadable body`));
        return response;
      },
      (error) => {
        this.recordHistory(`network error: ${error}`);
        throw error;
      },
    );
  }

  private recordHistory(result: string): void {
    this.historyRequests.update((requests) => [{ time: new Date(), result }, ...requests]);
    this.log(`History request: ${result}`);
  }

  private blockSessionStorage(): void {
    const blocked = window.sessionStorage;
    const proto = Storage.prototype;

    for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
      const native = proto[method] as (...args: unknown[]) => unknown;
      (proto as any)[method] = function (this: Storage, ...args: unknown[]) {
        if (this === blocked) throw new DOMException('sessionStorage blocked by harness', 'SecurityError');
        return native.apply(this, args);
      };
    }
  }

  private fakeMobileUserAgent(): void {
    Object.defineProperty(navigator, 'userAgent', { get: () => MOBILE_USER_AGENT });
  }
}
