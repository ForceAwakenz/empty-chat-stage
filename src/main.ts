import { bootstrapApplication } from '@angular/platform-browser';
import { mergeApplicationConfig } from '@angular/core';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { loadSettings } from './app/harness/harness-settings';
import { WidgetHooks } from './app/harness/widget-hooks';
import { loadWidget } from './app/harness/widget-loader';

// Hooks must patch WebSocket/fetch/storage before the widget bundle runs.
const settings = loadSettings();
const hooks = new WidgetHooks(settings);
loadWidget(settings);

bootstrapApplication(
  AppComponent,
  mergeApplicationConfig(appConfig, { providers: [{ provide: WidgetHooks, useValue: hooks }] }),
).catch((err) => console.error(err));
