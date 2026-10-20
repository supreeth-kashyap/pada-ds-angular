import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DsToggle } from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

export type ToggleSize = 'sm' | 'md' | 'lg';

/**
 * A button that stays pressed: bold, italic, "show archived". Announced with `aria-pressed`;
 * `data-state="on|off"`. Works with Angular forms (a boolean) or through `[(pressed)]`.
 *
 * ```html
 * <button dsToggle icon="text_bold" [(pressed)]="bold" aria-label="Bold"></button>
 * <button dsToggle size="sm" formControlName="archived">Show archived</button>
 * ```
 *
 * It includes the headless `DsToggle`; do not also import that directive in the same template.
 */
@Component({
  selector: 'button[dsToggle]',
  imports: [IconComponent],
  template: `@if (icon(); as icon) {
      <ds-icon [name]="icon" [size]="iconSize()" />
    }
    <ng-content />`,
  styleUrl: './toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: DsToggle, inputs: ['pressed', 'disabled'], outputs: ['pressedChange'] },
  ],
  host: {
    class: 'toggle',
    '[attr.data-size]': 'size()',
  },
})
export class ToggleComponent {
  /** Built-in icon name shown before the label. Icon-only toggles need an `aria-label`. */
  readonly icon = input<string>();
  /** Height: sm 28px, md 32px, lg 40px. @default 'md' */
  readonly size = input<ToggleSize>('md');
  protected readonly iconSize = computed(() => (this.size() === 'sm' ? 14 : 16));
}
