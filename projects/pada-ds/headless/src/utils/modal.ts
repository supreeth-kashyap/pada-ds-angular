let scrollLocks = 0;
let restoreScroll: (() => void) | null = null;

/**
 * Locks page scrolling, keeping the scrollbar's width so the layout does not shift. Locks are
 * counted, so nested modals unlock only when the last one closes. Returns the unlock.
 */
export function lockScroll(doc: Document = document): () => void {
  if (scrollLocks === 0) {
    const { body, documentElement } = doc;
    const win = doc.defaultView ?? window;
    const scrollbarWidth = win.innerWidth - documentElement.clientWidth;
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `calc(${win.getComputedStyle(body).paddingRight} + ${scrollbarWidth}px)`;
    }
    restoreScroll = () => {
      body.style.overflow = previous.overflow;
      body.style.paddingRight = previous.paddingRight;
    };
  }
  scrollLocks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    scrollLocks -= 1;
    if (scrollLocks === 0) {
      restoreScroll?.();
      restoreScroll = null;
    }
  };
}

const hiddenCounts = new WeakMap<Element, number>();

/**
 * Hides everything outside `target` from assistive technology (aria-hidden on the siblings of
 * each ancestor, up to <body>), so a modal's content is all a screen reader can reach. Elements
 * marked `data-pada-layer` (other open overlays) are skipped. A modal `<dialog>` opened with
 * `showModal()` does not need this: the browser makes the rest of the page inert. Returns the
 * cleanup.
 */
export function hideOthers(target: HTMLElement): () => void {
  const body = target.ownerDocument.body;
  const hidden: Element[] = [];
  let branch: Element | null = target;
  while (branch && branch !== body && branch.parentElement) {
    for (const sibling of Array.from(branch.parentElement.children)) {
      if (sibling === branch || sibling.hasAttribute('data-pada-layer')) continue;
      if (['SCRIPT', 'STYLE', 'TEMPLATE'].includes(sibling.tagName)) continue;
      const count = hiddenCounts.get(sibling) ?? 0;
      if (count === 0 && sibling.getAttribute('aria-hidden') === 'true') continue;
      hiddenCounts.set(sibling, count + 1);
      sibling.setAttribute('aria-hidden', 'true');
      hidden.push(sibling);
    }
    branch = branch.parentElement;
  }
  return () => {
    for (const element of hidden) {
      const count = (hiddenCounts.get(element) ?? 1) - 1;
      hiddenCounts.set(element, count);
      if (count === 0) element.removeAttribute('aria-hidden');
    }
  };
}
