import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { WidgetHooks } from '../harness/widget-hooks';
import { WidgetInspector } from '../harness/widget-inspector.service';
import { WidgetStatePanelComponent } from '../harness/widget-state-panel.component';
import { EventLogComponent } from '../harness/event-log.component';

@Component({
  selector: 'app-history-page',
  standalone: true,
  imports: [DatePipe, WidgetStatePanelComponent, EventLogComponent],
  template: `
    <h1>#76642: dialog history disappears after WS reconnect</h1>
    <p>
      Branch <code>bf-76642-livechat-widget-dialog-history-disappears-new</code>. After a socket drop the widget
      reconnects in 10s and reloads history. Bug: a new visitor (or a failed history request) ends with an empty dialog.
    </p>

    <section class="card">
      <h3>Steps</h3>
      <ol>
        <li><button class="link" (click)="inspector.resetVisitor()">Reset visitor</button> (acts as incognito).</li>
        <li>Open the chat, send 2–3 messages, wait for bot replies. Note "Messages in widget".</li>
        <li>Press a break button below. Wait about 15s for "WS open" in the log.</li>
        <li>Expect: "Messages in widget" is the same as before. Old build: only the start block is left.</li>
      </ol>
    </section>

    <section class="card">
      <h3>Break the connection</h3>
      <div class="actions">
        <button (click)="hooks.closeSockets()">
          Close WebSocket now
          <small class="expect">Expect: "WS open" in log after ~10s; message count unchanged</small>
        </button>
        <button (click)="hooks.goOffline(15000)">
          Go offline 15s
          <small class="expect">Expect: WS retries fail, then "WS open" after ~20s; message count unchanged</small>
        </button>
        <button class="secondary" (click)="inspector.callApi('open')">
          sp.liveChat.open()
          <small class="expect">Expect: chat opens; message count appears</small>
        </button>
      </div>
      <h4>Fail the history request on the next reconnect (old visitor case)</h4>
      <div class="actions">
        <button [class.on]="hooks.nextHistoryFailure() === 'network-error'" (click)="breakHistory('network-error')">
          Network error + close WS
          <small class="expect">Expect: history request fails after ~10s; messages stay</small>
        </button>
        <button
          [class.on]="hooks.nextHistoryFailure() === 'malformed-response'"
          (click)="breakHistory('malformed-response')"
        >
          Malformed 200 + close WS
          <small class="expect">Expect: history returns {{ '{}' }} after ~10s; messages stay</small>
        </button>
      </div>
      <p class="muted">Old build: the dialog is wiped in all cases above.</p>
    </section>

    <section class="card">
      <h3>History requests</h3>
      <ol class="log">
        @for (request of hooks.historyRequests(); track $index) {
          <li><time>{{ request.time | date: 'HH:mm:ss' }}</time> {{ request.result }}</li>
        } @empty {
          <li class="muted">None yet. A new visitor has no history request until the first message.</li>
        }
      </ol>
    </section>

    <div class="columns">
      <app-widget-state-panel />
      <app-event-log />
    </div>
  `,
})
export class HistoryPageComponent {
  readonly hooks = inject(WidgetHooks);
  readonly inspector = inject(WidgetInspector);

  breakHistory(failure: 'network-error' | 'malformed-response'): void {
    this.hooks.failNextHistoryRequest(failure);
    this.hooks.closeSockets();
  }
}
