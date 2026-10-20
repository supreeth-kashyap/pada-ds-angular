/*
 * pada-ds-angular/headless: behaviour, keyboard handling, focus and ARIA without any styles.
 * Every directive exposes its state through data-* and aria-* attributes for you to style.
 * The styled components in `pada-ds-angular` are built on these directives.
 */
export * from './dialog/dialog.directive';
export * from './field/field.directive';
export * from './popover/popover.directive';

export * from './utils/presence';
export * from './utils/floating.directive';
export * from './utils/visually-hidden';
export {
  dataFlag,
  openState,
  checkedState,
  getTabbable,
  focusElement,
  byDocumentOrder,
  showInTopLayer,
  hideFromTopLayer,
  isBrowser,
} from './utils/dom';
export {
  createDismissable,
  isTopLayer,
  type DismissEvent,
  type DismissableOptions,
} from './utils/dismissable';
export {
  createFocusScope,
  createAutoFocusEvent,
  type AutoFocusEvent,
  type FocusScopeOptions,
} from './utils/focus-scope';
export { lockScroll, hideOthers } from './utils/modal';
export {
  createFloating,
  type FloatingOptions,
  type FloatingPlacement,
  type FloatingAnchor,
  type Side,
  type Align,
} from './utils/floating';
export {
  findNextIndex,
  findTypeaheadIndex,
  keyToNavigation,
  type NavigableItem,
  type NavigationKey,
} from './utils/navigation';
export { createTypeahead } from './utils/typeahead';
export { uniqueId } from './utils/id';
export { injectButtonType } from './utils/button';
export { injectControlStatus, type ControlStatus } from './utils/forms';
export * from './tooltip/tooltip.directive';
export * from './hover-card/hover-card.directive';
export * from './alert-dialog/alert-dialog.directive';
export * from './resizable/resizable.directive';
export * from './theme/theme.service';
export * from './theme/theme.directive';
export * from './menu/menu.directive';
export * from './context-menu/context-menu.directive';
export * from './menubar/menubar.directive';
export * from './collapsible/collapsible.directive';
export * from './accordion/accordion.directive';
export * from './tabs/tabs.directive';
export * from './toggle/toggle.directive';
export * from './slider/slider.directive';
export * from './number-input/number-input.directive';
export {
  createNumberFormatter,
  roundToPrecision,
  type NumberFormatter,
} from './number-input/number-format';
export {
  clamp,
  injectHiddenInputs,
  injectFieldContext,
  type FieldContext,
} from './utils/form-controls';
export * from './pin-input/pin-input.directive';
export * from './combobox/combobox.directive';
export * from './calendar/calendar.directive';
export type { DateRangeValue } from './calendar/dates';
export * from './tree/tree.directive';
export * from './table/table.directive';
export * from './data-table/data-table';
export * from './toolbar/toolbar.directive';
