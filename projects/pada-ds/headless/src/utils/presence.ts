import {
  afterNextRender,
  DestroyRef,
  Directive,
  effect,
  EmbeddedViewRef,
  inject,
  Injector,
  input,
  TemplateRef,
  untracked,
  ViewContainerRef,
} from '@angular/core';

const toMs = (value: string) =>
  value.split(',').map((part) => {
    const trimmed = part.trim();
    const number = parseFloat(trimmed);
    if (Number.isNaN(number)) return 0;
    return trimmed.endsWith('ms') ? number : number * 1000;
  });

/** Longest transition or animation on the element, delays included, in ms. */
export function getExitDuration(node: Element): number {
  const view = node.ownerDocument.defaultView;
  if (!view) return 0;
  const style = view.getComputedStyle(node);
  const longest = (durations: string, delays: string) => {
    const d = toMs(durations);
    const l = toMs(delays);
    return Math.max(0, ...d.map((duration, index) => duration + (l[index % l.length] ?? 0)));
  };
  return Math.max(
    longest(style.transitionDuration || '0s', style.transitionDelay || '0s'),
    style.animationName && style.animationName !== 'none'
      ? longest(style.animationDuration || '0s', style.animationDelay || '0s')
      : 0,
  );
}

/**
 * Renders its element while the condition is true, like `@if`, but keeps it mounted after the
 * condition turns false until its exit transition or animation finishes, so closing parts can
 * animate out. Parts flip `data-state` to `"closed"` first; CSS animates it; then the element is
 * removed. With no transition (or reduced motion, where every Pada duration is 0) it is removed
 * immediately. The element stays where it is in the DOM.
 *
 * ```html
 * <div *dsPresence="open()" dsPopoverContent>…</div>
 * ```
 */
@Directive({ selector: '[dsPresence]' })
export class DsPresence {
  /** Whether the element should be shown. */
  readonly present = input.required<boolean>({ alias: 'dsPresence' });

  private readonly template = inject(TemplateRef);
  private readonly container = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private view: EmbeddedViewRef<unknown> | null = null;
  private exitCleanup: (() => void) | null = null;

  constructor() {
    effect(() => {
      const present = this.present();
      untracked(() => (present ? this.enter() : this.exit()));
    });
    inject(DestroyRef).onDestroy(() => this.exitCleanup?.());
  }

  private enter() {
    this.exitCleanup?.();
    this.exitCleanup = null;
    this.view ??= this.container.createEmbeddedView(this.template);
  }

  private exit() {
    if (!this.view || this.exitCleanup) return;
    const view = this.view;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      this.exitCleanup?.();
      this.exitCleanup = null;
      const index = this.container.indexOf(view);
      if (index !== -1) this.container.remove(index);
      if (this.view === view) this.view = null;
    };
    // Measured after the render that flips data-state to "closed", so the closed styles apply.
    const ref = afterNextRender(
      {
        read: () => {
          if (finished) return;
          const element = view.rootNodes.find((node): node is Element => node instanceof Element);
          const duration = element ? getExitDuration(element) : 0;
          if (duration === 0 || !element) {
            finish();
            return;
          }
          const onEnd = (event: Event) => event.target === element && finish();
          element.addEventListener('animationend', onEnd);
          // transitionend fires per property, so a timer at the longest duration is the reliable end.
          const timer = setTimeout(finish, duration + 34);
          this.exitCleanup = () => {
            element.removeEventListener('animationend', onEnd);
            clearTimeout(timer);
          };
        },
      },
      { injector: this.injector },
    );
    this.exitCleanup = () => ref.destroy();
  }
}
