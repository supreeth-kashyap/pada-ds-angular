import { computed, DestroyRef, effect, inject, Signal, signal, untracked } from '@angular/core';

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** The element's `--pada-motion-scale` (1 when unset, 0 under reduced motion). */
const motionScale = (element: Element | null) => {
  if (!element || typeof getComputedStyle === 'undefined') return 1;
  const raw = getComputedStyle(element).getPropertyValue('--pada-motion-scale').trim();
  if (raw === '') {
    return typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : 1;
  }
  const scale = Number(raw);
  return Number.isFinite(scale) ? scale : 1;
};

/**
 * A number that counts from its previous value to `value()` (a "ticker"), for KPIs and
 * counters. The first value shows as is. Respects `--pada-motion-scale` on `element`: with
 * reduced motion it jumps. Call it in an injection context.
 */
export function animatedNumber(
  value: Signal<number>,
  element: Element,
  duration: Signal<number>,
): Signal<number> {
  // Empty until the first value arrives (inputs are not set yet at construction).
  const display = signal<number | null>(null);
  let frame = 0;
  const cancel = () => {
    if (frame && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(frame);
    frame = 0;
  };
  inject(DestroyRef).onDestroy(cancel);

  effect(() => {
    const target = value();
    const total = duration() * untracked(() => motionScale(element));
    untracked(() => {
      cancel();
      const from = display();
      if (
        from === null ||
        from === target ||
        total <= 0 ||
        typeof requestAnimationFrame === 'undefined'
      ) {
        display.set(target);
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / total);
        display.set(from + (target - from) * easeOutCubic(progress));
        frame = progress < 1 ? requestAnimationFrame(tick) : 0;
      };
      frame = requestAnimationFrame(tick);
    });
  });

  return computed(() => display() ?? value());
}
