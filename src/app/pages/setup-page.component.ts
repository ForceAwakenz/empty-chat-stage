import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { applySettingsAndReload, LOADER_PRESETS, loadSettings } from '../harness/harness-settings';
import { WidgetInspector } from '../harness/widget-inspector.service';
import { WidgetStatePanelComponent } from '../harness/widget-state-panel.component';

@Component({
  selector: 'app-setup-page',
  standalone: true,
  imports: [FormsModule, RouterLink, WidgetStatePanelComponent],
  template: `
    <h1>Live chat widget test stage</h1>
    <p>
      Pick the widget build and bot, then open a feature page. To test a branch, run <code>yarn dev</code> in
      <code>onlinechats_client</code> on that branch and select <b>Local dev</b>.
    </p>

    <section class="card">
      <h3>Widget setup</h3>
      <label>
        Loader
        <select [(ngModel)]="draft.loaderSrc">
          @for (preset of loaderPresets; track preset.src) {
            <option [value]="preset.src">{{ preset.label }}</option>
          }
        </select>
      </label>
      <label>Loader URL <input [(ngModel)]="draft.loaderSrc" /></label>
      <label>Bot ID (<code>data-live-chat-id</code>) <input [(ngModel)]="draft.botId" /></label>
      <label>
        Color scheme
        <select [(ngModel)]="draft.colorScheme">
          <option value="auto">auto</option>
          <option value="light">light</option>
          <option value="dark">dark</option>
        </select>
      </label>
      <label class="check"><input type="checkbox" [(ngModel)]="draft.isEmbedded" /> Embedded mode</label>
      <div class="actions">
        <button (click)="apply()">
          Save &amp; reload
          <small class="expect">Expect: page reloads; top bar shows the new loader and bot</small>
        </button>
        <button class="secondary" (click)="inspector.resetVisitor()">
          Reset visitor (clear sp* storage)
          <small class="expect">Expect: page reloads; storage rows show "—"; widget treats you as new</small>
        </button>
      </div>
    </section>

    <section class="card">
      <h3>Feature pages</h3>
      <ul>
        <li><a routerLink="/auto-open">#51595: widget auto open</a></li>
        <li><a routerLink="/viber-link">#72959: Viber link opens wrong profile</a></li>
        <li><a routerLink="/history">#76642: dialog history disappears after WS reconnect</a></li>
      </ul>
    </section>

    <app-widget-state-panel />
  `,
})
export class SetupPageComponent {
  readonly inspector = inject(WidgetInspector);
  readonly loaderPresets = LOADER_PRESETS;
  readonly draft = loadSettings();

  apply(): void {
    applySettingsAndReload(this.draft);
  }
}
