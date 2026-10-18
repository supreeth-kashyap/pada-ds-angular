import {
  arrow as arrowMiddleware,
  autoUpdate,
  computePosition,
  flip,
  hide,
  offset,
  shift,
  size,
  type Placement,
  type VirtualElement,
} from '@floating-ui/dom';

export type Side = 'top' | 'right' | 'bottom' | 'left';
export type Align = 'start' | 'center' | 'end';

export interface FloatingOptions {
  /** Preferred side of the anchor. Flips to the opposite side when there is no room. */
  side?: Side;
  /** Alignment along the side. */
  align?: Align;
  /** Gap between anchor and content, in px. */
  sideOffset?: number;
  /** Shift along the alignment axis, in px. */
  alignOffset?: number;
  /** Flip and shift to stay in the viewport. */
  avoidCollisions?: boolean;
  /** Distance to keep from the viewport edges, in px. */
  collisionPadding?: number;
  /** Size of the arrow element, if any, so it stays inside rounded corners. */
  arrowPadding?: number;
  /** Hide the content when its anchor scrolls out of view. */
  hideWhenDetached?: boolean;
}

export interface FloatingPlacement {
  side: Side;
  align: Align;
}

export type FloatingAnchor = Element | VirtualElement;

const ORIGIN: Record<Side, string> = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' };

/**
 * Anchored positioning for popovers, menus and tooltips (Floating UI), kept up to date while the
 * anchor or the content moves or resizes. Positions with `position: fixed` and top/left, leaving
 * `transform` free for enter and exit motion.
 *
 * The floating element gets CSS variables the styled layer uses:
 * `--pada-floating-available-width/height`, `--pada-floating-anchor-width/height` and
 * `--pada-floating-transform-origin` (the anchor-facing edge, for scale-in motion).
 * `onPlacement` reports the resolved side and alignment for `data-side` / `data-align`.
 *
 * Returns the cleanup.
 */
export function createFloating(
  anchor: FloatingAnchor,
  floating: HTMLElement,
  options: () => FloatingOptions,
  onPlacement: (placement: FloatingPlacement) => void,
  arrow?: () => HTMLElement | null,
): () => void {
  // A [popover] gets UA styles (inset: 0, margin: auto) that would fight top/left.
  Object.assign(floating.style, {
    position: 'fixed',
    inset: 'auto',
    margin: '0',
    top: '0',
    left: '0',
  });

  const update = () => {
    const {
      side = 'bottom',
      align = 'center',
      sideOffset = 4,
      alignOffset = 0,
      avoidCollisions = true,
      collisionPadding = 8,
      arrowPadding = 0,
      hideWhenDetached = false,
    } = options();
    const arrowElement = arrow?.() ?? null;
    const placement = (align === 'center' ? side : `${side}-${align}`) as Placement;
    void computePosition(anchor, floating, {
      placement,
      strategy: 'fixed',
      middleware: [
        offset({ mainAxis: sideOffset, alignmentAxis: alignOffset }),
        avoidCollisions && flip({ padding: collisionPadding }),
        avoidCollisions && shift({ padding: collisionPadding }),
        size({
          padding: collisionPadding,
          apply({ availableWidth, availableHeight, rects, elements }) {
            const style = elements.floating.style;
            style.setProperty('--pada-floating-available-width', `${availableWidth}px`);
            style.setProperty('--pada-floating-available-height', `${availableHeight}px`);
            style.setProperty('--pada-floating-anchor-width', `${rects.reference.width}px`);
            style.setProperty('--pada-floating-anchor-height', `${rects.reference.height}px`);
          },
        }),
        arrowElement && arrowMiddleware({ element: arrowElement, padding: arrowPadding }),
        hideWhenDetached && hide({ strategy: 'referenceHidden' }),
      ],
    }).then(({ x, y, placement: resolved, middlewareData }) => {
      const [resolvedSide, resolvedAlign = 'center'] = resolved.split('-') as [
        Side,
        Align | undefined,
      ];
      floating.style.left = `${x}px`;
      floating.style.top = `${y}px`;
      floating.style.setProperty('--pada-floating-transform-origin', ORIGIN[resolvedSide]);
      const hidden = hideWhenDetached && middlewareData.hide?.referenceHidden;
      floating.style.visibility = hidden ? 'hidden' : '';
      floating.style.pointerEvents = hidden ? 'none' : '';
      if (arrowElement) {
        const data = middlewareData.arrow;
        Object.assign(arrowElement.style, {
          position: 'absolute',
          left: data?.x != null ? `${data.x}px` : '',
          top: data?.y != null ? `${data.y}px` : '',
          right: '',
          bottom: '',
          [ORIGIN[resolvedSide]]: '0',
        });
        arrowElement.setAttribute('data-side', resolvedSide);
      }
      onPlacement({ side: resolvedSide, align: resolvedAlign });
    });
  };

  return autoUpdate(anchor, floating, update, { animationFrame: false });
}
