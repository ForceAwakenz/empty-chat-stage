import { Component, inject } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { WidgetInspector } from './widget-inspector.service';

@Component({
  selector: 'app-widget-state-panel',
  standalone: true,
  imports: [KeyValuePipe],
  template: `
    <section class="card">
      <h3>Widget state <small>(refreshes every 1s)</small></h3>
      <table class="kv">
        <tr><th>Widget mounted</th><td>{{ state.isLoaded ? 'yes' : 'no' }}</td></tr>
        <tr>
          <th>Messages in widget</th>
          <td>{{ state.messageCount ?? '—' }} <small>(rendered only while chat is open)</small></td>
        </tr>
        @for (entry of state.storage | keyvalue; track entry.key) {
          <tr><th><code>{{ entry.key }}</code></th><td><code>{{ entry.value }}</code></td></tr>
        }
      </table>
    </section>
  `,
})
export class WidgetStatePanelComponent {
  private readonly inspector = inject(WidgetInspector);

  get state() {
    return this.inspector.snapshot();
  }
}
