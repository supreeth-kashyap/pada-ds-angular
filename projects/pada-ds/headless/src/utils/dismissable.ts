/** Event passed to dismiss callbacks. Call `preventDefault()` to keep the layer open. */
export interface DismissEvent<E extends Event = Event> {
  originalEvent: E;
  target: EventTarget | null;
  defaultPrevented: boolean;
  preventDefault(): void;
}

function createDismissEvent<E extends Event>(originalEvent: E): DismissEvent<E> {
  const event: DismissEvent<E> = {
    originalEvent,
    target: originalEvent.target,
    defaultPrevented: false,
    preventDefault() {
      event.defaultPrevented = true;
    },
  };
  return event;
}

export interface DismissableOptions {
  /** Called when the layer should close (after the specific callback, unless it prevented it). */
  onDismiss: () => void;
  onEscapeKeyDown?: (event: DismissEvent<KeyboardEvent>) => void;
  onPointerDownOutside?: (event: DismissEvent<PointerEvent>) => void;
  onFocusOutside?: (event: DismissEvent<FocusEvent>) => void;
  /** Called for both pointer-down and focus outside, before the specific callback. */
  onInteractOutside?: (event: DismissEvent<PointerEvent | FocusEvent>) => void;
  /** Close when focus moves outside. Non-modal overlays (popover, menu) want this; dialogs do not. */
  dismissOnFocusOutside?: boolean;
}

// Open layers in the order they opened. Only the top layer reacts to Escape, and a layer
// ignores interactions inside any layer opened after it (a menu inside a dialog, a submenu).
const layers: HTMLElement[] = [];

const isInsideLayerAbove = (layer: HTMLElement, target: Node) => {
  const index = layers.indexOf(layer);
  return layers.slice(index + 1).some((above) => above.contains(target));
};

/** A click on a modal `<dialog>`'s ::backdrop targets the dialog itself, outside its box. */
const isBackdropClick = (layer: HTMLElement, event: Event) => {
  if (!(layer instanceof HTMLDialogElement) || event.target !== layer || !('clientX' in event))
    return false;
  const { clientX, clientY } = event as PointerEvent;
  const box = layer.getBoundingClientRect();
  if (box.width === 0 && box.height === 0) return false;
  return clientX < box.left || clientX > box.right || clientY < box.top || clientY > box.bottom;
};

/** Whether `layer` is the topmost open layer. */
export const isTopLayer = (layer: HTMLElement) => layers[layers.length - 1] === layer;

/**
 * Closes a floating layer on Escape, on pointer-down outside it, and (optionally) when focus
 * leaves it. Layers stack: Escape only closes the topmost, and clicks inside a nested layer do
 * not count as "outside" for the layers beneath it. Returns the cleanup.
 */
export function createDismissable(
  layer: HTMLElement,
  options: () => DismissableOptions,
): () => void {
  layers.push(layer);
  const doc = layer.ownerDocument;
  const win = doc.defaultView ?? window;

  const dismissWith = <E extends Event>(
    originalEvent: E,
    specific: ((event: DismissEvent<E>) => void) | undefined,
    interact: boolean,
  ) => {
    const event = createDismissEvent(originalEvent);
    if (interact)
      options().onInteractOutside?.(event as unknown as DismissEvent<PointerEvent | FocusEvent>);
    if (!event.defaultPrevented) specific?.(event);
    if (!event.defaultPrevented) options().onDismiss();
  };

  const isOutside = (target: EventTarget | null) =>
    target instanceof Node && !layer.contains(target) && !isInsideLayerAbove(layer, target);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !isTopLayer(layer) || event.defaultPrevented) return;
    // Handled here, so a native <dialog> does not also close itself through its cancel event.
    event.preventDefault();
    dismissWith(event, options().onEscapeKeyDown, false);
  };
  const onPointerDown = (event: PointerEvent) => {
    if (isOutside(event.target) || (isTopLayer(layer) && isBackdropClick(layer, event))) {
      dismissWith(event, options().onPointerDownOutside, true);
    }
  };
  const onFocusIn = (event: FocusEvent) => {
    if (options().dismissOnFocusOutside && isOutside(event.target)) {
      dismissWith(event, options().onFocusOutside, true);
    }
  };

  doc.addEventListener('keydown', onKeyDown);
  doc.addEventListener('focusin', onFocusIn);
  // Registered on the next tick so the pointer-down that opened the layer does not close it.
  const timer = win.setTimeout(() => doc.addEventListener('pointerdown', onPointerDown, true), 0);

  return () => {
    const index = layers.indexOf(layer);
    if (index !== -1) layers.splice(index, 1);
    win.clearTimeout(timer);
    doc.removeEventListener('keydown', onKeyDown);
    doc.removeEventListener('focusin', onFocusIn);
    doc.removeEventListener('pointerdown', onPointerDown, true);
  };
}
