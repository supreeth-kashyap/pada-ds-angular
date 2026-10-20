import { ChangeDetectionStrategy, Component } from '@angular/core';

/** A placeholder page: the library is documented in Storybook, not in this app. */
@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
