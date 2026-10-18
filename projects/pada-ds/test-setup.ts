// toBeInTheDocument(), toHaveAttribute(), toHaveFocus() … on Vitest's expect.
import '@testing-library/jest-dom/vitest';

// jsdom has no top layer: <dialog> showModal/show/close are stubbed so the overlay parts can
// run. Behaviour that matters (Escape, outside clicks, focus) is Pada's own code, which the
// tests exercise for real.
const dialogProto = HTMLDialogElement.prototype as HTMLDialogElement & Record<string, unknown>;
if (typeof dialogProto.showModal !== 'function') {
  dialogProto.show = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  dialogProto.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  dialogProto.close = function (this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
if (!('open' in dialogProto)) {
  Object.defineProperty(dialogProto, 'open', {
    get(this: HTMLDialogElement) {
      return this.hasAttribute('open');
    },
  });
}

// The Popover API is left out on purpose: without it, floating parts skip the top layer (as in
// browsers that lack it) and jsdom does not hide them through its [popover] UA style.

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = function () {};
}

if (typeof window.PointerEvent === 'undefined') {
  // jsdom lacks PointerEvent; a MouseEvent with pointerId is close enough for the parts.
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'mouse';
    }
  }
  (window as unknown as Record<string, unknown>)['PointerEvent'] = PointerEventPolyfill;
}
