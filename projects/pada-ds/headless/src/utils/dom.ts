/** `''` when true and `null` when false, for boolean `data-*` attributes (`[attr.data-disabled]`). */
export const dataFlag = (value: boolean | null | undefined): '' | null => (value ? '' : null);

/** `"open"` or `"closed"`, for `data-state` on disclosure and overlay parts. */
export const openState = (open: boolean): 'open' | 'closed' => (open ? 'open' : 'closed');

/** `"checked"`, `"unchecked"` or `"indeterminate"`, for `data-state` on checkable parts. */
export const checkedState = (
  checked: boolean | 'indeterminate',
): 'checked' | 'unchecked' | 'indeterminate' =>
  checked === 'indeterminate' ? 'indeterminate' : checked ? 'checked' : 'unchecked';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
  '[contenteditable="true"]',
].join(', ');

/** Tabbable elements inside `root`, in DOM order. Scoped to the root, never the document. */
export const getTabbable = (root: HTMLElement | null): HTMLElement[] =>
  root
    ? Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => element.tabIndex >= 0 && !element.closest('[hidden], [inert]'),
      )
    : [];

/** Focuses without scrolling the page, which would jump when an overlay opens. */
export const focusElement = (element: HTMLElement | null | undefined) =>
  element?.focus({ preventScroll: true });

/** Sorts elements into document order (registration order is not reliable with `@for`). */
export const byDocumentOrder = (a: Element, b: Element) =>
  a === b ? 0 : a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;

/**
 * Puts a floating element in the browser's top layer (`popover="manual"`), above every stacking
 * context and outside any `overflow: hidden` ancestor, while it stays in place in the DOM so it
 * keeps inheriting theme attributes and styles. Browsers without the Popover API fall back to
 * `position: fixed` and the `--pada-z-*` tokens.
 */
export function showInTopLayer(element: HTMLElement) {
  if (typeof element.showPopover !== 'function') return;
  if (!element.hasAttribute('popover')) element.setAttribute('popover', 'manual');
  try {
    if (!element.matches(':popover-open')) element.showPopover();
  } catch {
    // Not connected yet, or already shown; positioning still works without the top layer.
  }
}

/** Removes an element from the top layer again (it also leaves when removed from the DOM). */
export function hideFromTopLayer(element: HTMLElement) {
  if (typeof element.hidePopover !== 'function') return;
  try {
    if (element.matches(':popover-open')) element.hidePopover();
  } catch {
    // Already hidden.
  }
}

/** Whether the code runs in a browser (not during server rendering). */
export const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';
