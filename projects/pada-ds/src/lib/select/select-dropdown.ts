import { computed, Directive, input, output } from '@angular/core';
import { DsFloating, injectFloatingLayer, openState } from 'pada-ds-angular/headless';

/** The floating list: in the top layer, under (or above) the trigger, closed by outside clicks. */
@Directive({
  selector: '[dsSelectDropdown]',
  hostDirectives: [DsFloating],
  host: { 'data-pada-layer': '', '[attr.data-state]': 'state()' },
})
export class SelectDropdownDirective {
  /** Whether the list is open (false while it animates out). */
  readonly open = input.required<boolean>();
  /** The trigger it is positioned against. */
  readonly anchor = input.required<HTMLElement>();
  /** An outside click or Escape asked it to close. */
  readonly dismissed = output<void>();
  protected readonly state = computed(() => openState(this.open()));

  constructor() {
    injectFloatingLayer({
      open: this.open,
      anchor: () => this.anchor(),
      dismiss: () => ({
        onDismiss: () => this.dismissed.emit(),
        onInteractOutside: (event) => {
          if (event.target instanceof Node && this.anchor().contains(event.target))
            event.preventDefault();
        },
      }),
    });
  }
}
