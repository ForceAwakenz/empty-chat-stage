import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { applySettingsAndReload, HarnessSettings, loadSettings } from '../harness/harness-settings';
import { WidgetInspector } from '../harness/widget-inspector.service';
import { WidgetStatePanelComponent } from '../harness/widget-state-panel.component';
import { EventLogComponent } from '../harness/event-log.component';

type ToggleKey = 'autoOpen' | 'simulateMobile' | 'blockSessionStorage';

@Component({
  selector: 'app-auto-open-page',
  standalone: true,
  imports: [WidgetStatePanelComponent, EventLogComponent],
  template: `
    <h1>#51595: widget auto open <small>page {{ step }}</small></h1>
    <p>
      Branch <code>ft-51595-livechat-widget-auto-open</code>. With <code>autoOpen: true</code> the floating widget
      opens once per tab, on the first page load. Toggles below reload the page.
    </p>
    @if (settings.isEmbedded) {
      <p class="warn">Embedded mode is on. Embedded chat is always open, so auto open has no effect. Switch it off on Setup.</p>
    }

    <section class="card">
      <h3>Config (applied at load)</h3>
      <div class="actions">
        @for (toggle of toggles; track toggle.key) {
          <button [class.on]="settings[toggle.key]" [class.secondary]="!settings[toggle.key]" (click)="flip(toggle.key)">
            {{ toggle.label }}: {{ settings[toggle.key] ? 'ON' : 'off' }}
            <small class="expect">After click: {{ settings[toggle.key] ? toggle.expectOff : toggle.expectOn }}</small>
          </button>
        }
      </div>
    </section>

    <section class="card">
      <h3>Navigation (full page loads)</h3>
      <div class="actions">
        <a class="button" [href]="'/auto-open/' + (step + 1)">
          Go to page {{ step + 1 }} (same tab)
          <small class="expect">Expect: no auto open; chat stays as you left it</small>
        </a>
        <!-- noopener: without it the browser may copy sessionStorage into the new tab -->
        <a class="button secondary" href="/auto-open" target="_blank" rel="noopener">
          Open in new tab
          <small class="expect">Expect (autoOpen ON): chat opens in the new tab</small>
        </a>
        <button class="secondary" (click)="reload()">
          Reload this page
          <small class="expect">Expect: no auto open; chat stays as you left it</small>
        </button>
      </div>
    </section>

    <section class="card">
      <h3>Manual controls</h3>
      <div class="actions">
        <button (click)="inspector.callApi('open')">
          sp.liveChat.open()
          <small class="expect">Expect: chat opens. Build without JS API: log says "missing"</small>
        </button>
        <button (click)="inspector.callApi('close')">
          sp.liveChat.close()
          <small class="expect">Expect: chat closes; spLiveChatOpened becomes "—"</small>
        </button>
        <button (click)="inspector.callApi('toggle')">
          sp.liveChat.toggle()
          <small class="expect">Expect: chat flips open/closed</small>
        </button>
      </div>
      <div class="actions">
        <button class="secondary" (click)="inspector.clearSessionFlag()">
          Clear session flag (act as new tab)
          <small class="expect">Expect: next reload auto opens the chat (autoOpen ON)</small>
        </button>
        <button class="secondary" (click)="inspector.removeStorageItem('local', 'spLiveChatOpened')">
          Clear spLiveChatOpened
          <small class="expect">Expect: next reload keeps chat closed, unless auto open fires</small>
        </button>
        <button class="secondary" (click)="inspector.resetVisitor()">
          Reset visitor
          <small class="expect">Expect: reload as new visitor; chat opens if autoOpen ON (desktop)</small>
        </button>
      </div>
    </section>

    <section class="card">
      <h3>Scenarios</h3>
      <table class="scenarios">
        <tr><th>Do</th><th>Expect</th></tr>
        <tr><td>autoOpen ON, Reset visitor</td><td>Chat opens. <code>session.spLiveChatAutoOpenShown</code> = true.</td></tr>
        <tr><td>Close chat, go to next page</td><td>Chat stays closed.</td></tr>
        <tr><td>Open in new tab</td><td>Chat opens in the new tab.</td></tr>
        <tr><td>Reload this page</td><td>Same tab: chat does not auto open again (only if it was closed).</td></tr>
        <tr><td>autoOpen off, Reset visitor</td><td>Chat stays closed (old behavior).</td></tr>
        <tr><td>Simulate mobile ON, Reset visitor</td><td>Chat stays closed.</td></tr>
        <tr><td>Block sessionStorage ON, Reset visitor</td><td>Chat stays closed. Storage row shows "blocked".</td></tr>
        <tr>
          <td>Known corner case: leave chat open, close tab, open site in new tab, close chat, go to next page</td>
          <td>Chat opens again on next page (accepted behavior).</td>
        </tr>
      </table>
    </section>

    <div class="columns">
      <app-widget-state-panel />
      <app-event-log />
    </div>
  `,
})
export class AutoOpenPageComponent {
  readonly inspector = inject(WidgetInspector);
  readonly settings = loadSettings();
  readonly step = Number(inject(ActivatedRoute).snapshot.paramMap.get('step') ?? 1);
  readonly toggles: { key: ToggleKey; label: string; expectOn: string; expectOff: string }[] = [
    {
      key: 'autoOpen',
      label: 'autoOpen',
      expectOn: 'reload; chat opens if this tab has not auto opened yet',
      expectOff: 'reload; chat never auto opens (old behavior)',
    },
    {
      key: 'simulateMobile',
      label: 'Simulate mobile UA',
      expectOn: 'reload; floating chat never auto opens',
      expectOff: 'reload; desktop behavior',
    },
    {
      key: 'blockSessionStorage',
      label: 'Block sessionStorage',
      expectOn: 'reload; no auto open; session row shows "blocked"',
      expectOff: 'reload; normal storage',
    },
  ];

  flip(key: ToggleKey): void {
    applySettingsAndReload({ [key]: !this.settings[key] } as Partial<HarnessSettings>);
  }

  reload(): void {
    location.reload();
  }
}
