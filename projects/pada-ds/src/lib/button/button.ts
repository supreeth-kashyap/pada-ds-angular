import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { dataFlag } from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';
import { BUTTON_GROUP } from './button-context';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * A button, on a native `<button>` or a link (`<a dsButton href>`).
 *
 * ```html
 * <button dsButton variant="secondary" leftIcon="add" (click)="add()">Add member</button>
 * ```
 *
 * `loading` shows a spinner over the label and ignores clicks, keeping the width and focus
 * (unlike `disabled`); it is announced through `aria-busy`. A `<button>` without a `type` gets
 * `type="button"`, so it never submits a form by accident: add `type="submit"` to the one that
 * should.
 *
 * Inside a `ds-button-group` or `ds-split-button`, a button without its own `size` / `variant`
 * takes the group's.
 *
 * Differences from React: the split button is its own component, `ds-split-button` with a
 * `button[dsButtonSplitter]` part, instead of `split` / `onSplitClick` props, so the splitter can
 * be a menu trigger.
 */
@Component({
  selector: 'button[dsButton], a[dsButton]',
  imports: [IconComponent],
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'button',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-loading]': 'loadingFlag()',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.aria-disabled]': 'loading() || null',
  },
})
export class ButtonComponent {
  /** Visual emphasis. @default 'primary' */
  readonly variant = input<ButtonVariant | undefined>(undefined);
  /** Height and padding: sm 28px, md 32px, lg 40px (scaled by density). @default 'md' */
  readonly size = input<ButtonSize | undefined>(undefined);
  /** Shows a spinner in place of the label and ignores clicks. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Built-in icon name before the label. */
  readonly leftIcon = input<string>();
  /** Built-in icon name after the label (it nudges forward on hover). Ignored with `leftIcon`. */
  readonly rightIcon = input<string>();

  private readonly group = inject(BUTTON_GROUP, { optional: true });
  /** The variant in effect: this button's, else its group's, else `primary`. */
  readonly resolvedVariant = computed(() => this.variant() ?? this.group?.variant() ?? 'primary');
  /** The size in effect: this button's, else its group's, else `md`. */
  readonly resolvedSize = computed(() => this.size() ?? this.group?.size() ?? 'md');
  protected readonly loadingFlag = computed(() => dataFlag(this.loading()));

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    if (element.tagName === 'BUTTON' && !element.hasAttribute('type'))
      element.setAttribute('type', 'button');
    // Capture phase on the button itself runs before any (click) handler bound to it.
    element.addEventListener(
      'click',
      (event) => {
        if (!this.loading()) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      { capture: true },
    );
  }
}
