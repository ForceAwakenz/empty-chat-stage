import { Component, inject } from '@angular/core';
import { WidgetInspector, MenuLink } from '../harness/widget-inspector.service';
import { EventLogComponent } from '../harness/event-log.component';

type Verdict = { ok: boolean; text: string };

const SAMPLE_URLS = [
  { url: 'viber://chat?number=380000000000', expect: 'Kept as typed. No context param.' },
  { url: 'viber://pa?chatURI=sendpulse', expect: 'viber://pa?chatURI=sendpulse&context=<uuid>' },
  { url: 'https://t.me/some_bot', expect: 'https://t.me/some_bot?start=<uuid> (unchanged behavior)' },
  { url: 'https://m.me/some.page', expect: 'https://m.me/some.page?ref=<uuid> (unchanged behavior)' },
  { url: 'https://example.com/?a=1', expect: 'Kept as typed (unchanged behavior)' },
];

@Component({
  selector: 'app-viber-link-page',
  standalone: true,
  imports: [EventLogComponent],
  template: `
    <h1>#72959: Viber link opens wrong profile</h1>
    <p>
      Branch <code>bf-72959-livechat-viber-link-wrong-profile</code>. Bug: a welcome menu button with
      <code>viber://chat?number=…</code> became <code>viber://pa?chatURI=null&amp;context=…</code>.
    </p>

    <section class="card">
      <h3>1. Set up the bot (admin, once)</h3>
      <ol>
        <li>Open the bot: Bot settings → Bot welcome → Welcome menu.</li>
        <li>Add one "Open website" button per URL below. Save.</li>
        <li>Reload this page and open the chat.</li>
      </ol>
      <table class="scenarios">
        <tr><th>Button URL</th><th>Expected widget href</th><th></th></tr>
        @for (sample of samples; track sample.url) {
          <tr>
            <td><code>{{ sample.url }}</code></td>
            <td>{{ sample.expect }}</td>
            <td><button class="link" (click)="copy(sample.url)">copy</button></td>
          </tr>
        }
      </table>
    </section>

    <section class="card">
      <h3>2. Check widget menu links <small>(live, chat must be open)</small></h3>
      <div class="actions">
        <button (click)="inspector.callApi('open')">
          sp.liveChat.open()
          <small class="expect">Expect: chat opens; menu links fill the table below</small>
        </button>
      </div>
      <table class="scenarios">
        <tr><th>Button</th><th>Rendered href</th><th>Verdict</th></tr>
        @for (link of inspector.snapshot().menuLinks; track $index) {
          <tr>
            <td>{{ link.text }}</td>
            <td><code>{{ link.href }}</code></td>
            <td [class.pass]="judge(link).ok" [class.fail]="!judge(link).ok">{{ judge(link).text }}</td>
          </tr>
        } @empty {
          <tr><td colspan="3" class="muted">No menu links found. Open the chat, or add buttons to the bot.</td></tr>
        }
      </table>
      <p class="muted">
        Bot-link hrefs get a new uuid after each click. Without Viber installed, the check above replaces
        "Inspect element".
      </p>
    </section>

    <app-event-log />
  `,
})
export class ViberLinkPageComponent {
  readonly inspector = inject(WidgetInspector);
  readonly samples = SAMPLE_URLS;

  judge(link: MenuLink): Verdict {
    if (!link.href.startsWith('viber:')) return { ok: true, text: 'not Viber: compare with table above' };
    if (link.href.includes('chatURI=null')) return { ok: false, text: 'FAIL: chatURI=null (bug)' };

    const url = new URL(link.href);
    if (url.searchParams.has('number')) {
      return url.searchParams.has('context')
        ? { ok: false, text: 'FAIL: phone link got context param' }
        : { ok: true, text: 'PASS: phone link kept' };
    }
    return url.searchParams.has('context')
      ? { ok: true, text: 'PASS: bot link has context' }
      : { ok: false, text: 'FAIL: bot link has no context' };
  }

  copy(text: string): void {
    navigator.clipboard.writeText(text);
  }
}
