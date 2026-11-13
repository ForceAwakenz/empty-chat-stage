import { Routes } from '@angular/router';
import { SetupPageComponent } from './pages/setup-page.component';
import { AutoOpenPageComponent } from './pages/auto-open-page.component';
import { ViberLinkPageComponent } from './pages/viber-link-page.component';
import { HistoryPageComponent } from './pages/history-page.component';

export const routes: Routes = [
  { path: '', component: SetupPageComponent, title: 'Setup' },
  { path: 'auto-open', component: AutoOpenPageComponent, title: '#51595 Auto open' },
  { path: 'auto-open/:step', component: AutoOpenPageComponent, title: '#51595 Auto open' },
  { path: 'viber-link', component: ViberLinkPageComponent, title: '#72959 Viber link' },
  { path: 'history', component: HistoryPageComponent, title: '#76642 History' },
  { path: '**', redirectTo: '' },
];
