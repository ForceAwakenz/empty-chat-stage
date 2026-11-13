import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { WidgetHooks } from './widget-hooks';

@Component({
  selector: 'app-event-log',
  standalone: true,
  imports: [DatePipe],
  template: `
    <section class="card">
      <h3>Event log <button class="link" (click)="hooks.events.set([])">clear</button></h3>
      <ol class="log">
        @for (event of hooks.events(); track $index) {
          <li><time>{{ event.time | date: 'HH:mm:ss' }}</time> {{ event.text }}</li>
        } @empty {
          <li class="muted">No events yet.</li>
        }
      </ol>
    </section>
  `,
})
export class EventLogComponent {
  readonly hooks = inject(WidgetHooks);
}
