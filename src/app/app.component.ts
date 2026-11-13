import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LOADER_PRESETS, loadSettings } from './harness/harness-settings';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly settings = loadSettings();
  readonly loaderLabel =
    LOADER_PRESETS.find((preset) => preset.src === this.settings.loaderSrc)?.label ?? this.settings.loaderSrc;
}
