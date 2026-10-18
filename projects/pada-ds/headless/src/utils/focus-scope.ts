import { focusElement, getTabbable } from './dom';

/** Event passed to auto-focus callbacks. Call `preventDefault()` to handle focus yourself. */
export interface AutoFocusEvent {
  defaultPrevented: boolean;
  preventDefault(): void;
}

export const createAutoFocusEvent = (): AutoFocusEvent => {
  const event: AutoFocusEvent = {
    defaultPrevented: false,
    preventDefault() {
      event.defaultPrevented = true;
    },
  };
  return event;
};

export interface FocusScopeOptions {
  /** Keep Tab and Shift+Tab, and focus generally, inside the container. */
  trapped: boolean;
  /** Called before focus moves in on mount. Prevent it to focus something else yourself. */
  onMountAutoFocus?: (event: AutoFocusEvent) => void;
  /** Called before focus returns to the previously focused element on unmount. */
  onUnmountAutoFocus?: (event: AutoFocusEvent) => void;
}

/** Cleanup returned by `createFocusScope`. */
export interface FocusScope {
  /**
   * The container is closing: asks `onUnmountAutoFocus` whether focus should return. Call it
   * when the close starts (outputs can still emit then); `destroy` calls it if you did not.
   */
  closing(): void;
  /** Stops trapping and, unless prevented, returns focus once the container has left the DOM. */
  destroy(): void;
}

/**
 * Moves focus into the container (the element with `data-autofocus`, else the first tabbable,
 * else the container itself), optionally traps it there, and returns it to whatever was focused
 * before when the scope is destroyed.
 */
export function createFocusScope(
  container: HTMLElement,
  options: () => FocusScopeOptions,
  /** What was focused before the container opened, if something (`showModal()`) moved it already. */
  previouslyFocused: Element | null = container.ownerDocument.activeElement,
): FocusScope {
  const doc = container.ownerDocument;
  const win = doc.defaultView ?? window;
  const restoreTarget =
    previouslyFocused instanceof HTMLElement && !container.contains(previouslyFocused)
      ? previouslyFocused
      : null;

  // Focus that was outside moves in (a native showModal() may have moved it in already).
  if (!container.contains(previouslyFocused)) {
    const event = createAutoFocusEvent();
    options().onMountAutoFocus?.(event);
    if (!event.defaultPrevented) {
      const preferred = container.querySelector<HTMLElement>('[data-autofocus]');
      focusElement(preferred ?? getTabbable(container)[0] ?? container);
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (!options().trapped) return;
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
    const tabbable = getTabbable(container);
    if (tabbable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = tabbable[0];
    const last = tabbable[tabbable.length - 1];
    const current = doc.activeElement;
    if (event.shiftKey && (current === first || current === container)) {
      event.preventDefault();
      focusElement(last);
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      focusElement(first);
    }
  };
  // Focus that escapes some other way (a click on a scrollbar, programmatic focus) comes back.
  const onFocusIn = (event: FocusEvent) => {
    if (!options().trapped) return;
    const target = event.target as Node | null;
    if (
      target &&
      !container.contains(target) &&
      !(target as Element).closest?.('[data-pada-layer]')
    ) {
      focusElement(getTabbable(container)[0] ?? container);
    }
  };

  container.addEventListener('keydown', onKeyDown);
  doc.addEventListener('focusin', onFocusIn);

  let restore: boolean | null = null;
  return {
    closing() {
      if (restore !== null) return;
      const event = createAutoFocusEvent();
      options().onUnmountAutoFocus?.(event);
      restore = !event.defaultPrevented;
    },
    destroy() {
      container.removeEventListener('keydown', onKeyDown);
      doc.removeEventListener('focusin', onFocusIn);
      // Prevented when the close started. Destroyed without closing (the whole view went away)
      // restores without asking: outputs can no longer emit by then.
      if (restore === false) return;
      // Deferred until the container has left the DOM. Only focus that was lost with it (now on
      // <body>) returns; focus the user already moved elsewhere, such as into another popover,
      // stays where it is.
      win.setTimeout(() => {
        const current = doc.activeElement;
        const focusLost =
          !current || current === doc.body || !current.isConnected || container.contains(current);
        if (focusLost && restoreTarget?.isConnected) focusElement(restoreTarget);
      }, 0);
    },
  };
}
