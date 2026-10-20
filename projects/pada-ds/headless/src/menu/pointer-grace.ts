interface Point {
  x: number;
  y: number;
}

/** Ray casting: whether the point lies inside the polygon. */
function isInside({ x, y }: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

const GRACE_MS = 300;

/**
 * Pointer grace for submenus: when the pointer leaves an open submenu's trigger towards its
 * content, the items it crosses on the way do not take the highlight (which would close the
 * submenu). The grace area is the shape between the exit point and the submenu's near edge;
 * it lapses after a short pause.
 */
export class MenuPointerGrace {
  private area: readonly Point[] | null = null;
  private source: HTMLElement | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  /** Starts a grace period for a pointer leaving `trigger` towards `content`. */
  start(trigger: HTMLElement, content: HTMLElement, exit: Point) {
    const box = content.getBoundingClientRect();
    if (box.width === 0 && box.height === 0) return;
    const toRight = box.left >= exit.x;
    const bleed = toRight ? -5 : 5;
    const near = toRight ? box.left : box.right;
    const far = toRight ? box.right : box.left;
    this.area = [
      { x: exit.x + bleed, y: exit.y },
      { x: near, y: box.top },
      { x: far, y: box.top },
      { x: far, y: box.bottom },
      { x: near, y: box.bottom },
    ];
    this.source = trigger;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.clear(), GRACE_MS);
  }

  clear() {
    clearTimeout(this.timer);
    this.area = null;
    this.source = null;
  }

  /** Whether a pointer event on `element` falls in the grace area of another item's submenu. */
  blocks(event: PointerEvent, element: HTMLElement | null): boolean {
    if (!this.area || element === this.source) return false;
    return isInside({ x: event.clientX, y: event.clientY }, this.area);
  }
}
