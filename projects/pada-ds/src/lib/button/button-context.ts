import { InjectionToken } from '@angular/core';
import type { ButtonSize, ButtonVariant } from './button';

/**
 * What a `ds-button-group` or `ds-split-button` hands down to the buttons inside it. A button's
 * own `size` / `variant` input wins; the group's value fills in when the button sets none.
 */
export interface ButtonGroupContext {
  readonly size: () => ButtonSize | undefined;
  readonly variant: () => ButtonVariant | undefined;
}

export const BUTTON_GROUP = new InjectionToken<ButtonGroupContext>('ButtonGroup');
