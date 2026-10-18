import { Directive } from '@angular/core';

/** Content for screen readers only: an icon button's label, a dialog title the design hides. */
@Directive({
  selector: '[dsVisuallyHidden]',
  host: {
    '[style.position]': '"absolute"',
    '[style.width.px]': '1',
    '[style.height.px]': '1',
    '[style.padding]': '"0"',
    '[style.margin.px]': '-1',
    '[style.overflow]': '"hidden"',
    '[style.clip]': '"rect(0, 0, 0, 0)"',
    '[style.white-space]': '"nowrap"',
    '[style.border]': '"0"',
  },
})
export class DsVisuallyHidden {}
