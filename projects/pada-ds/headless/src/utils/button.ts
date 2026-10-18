import { ElementRef, inject } from '@angular/core';

/**
 * Gives a `<button>` host `type="button"` unless it already has a type, so a trigger inside a
 * form never submits it. Call it in a directive's constructor.
 */
export function injectButtonType(): HTMLElement {
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  if (element.tagName === 'BUTTON' && !element.hasAttribute('type'))
    element.setAttribute('type', 'button');
  return element;
}
