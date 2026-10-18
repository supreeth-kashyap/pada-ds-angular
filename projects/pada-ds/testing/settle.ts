import { ComponentFixture, TestBed } from '@angular/core/testing';

/**
 * Lets everything an interaction set off finish: change detection, effects (overlays mount
 * through `*dsPresence`), `afterNextRender` hooks (overlays join the top layer and move focus
 * there) and the zero-delay timers parts use (outside-click listeners, focus restore).
 */
export async function settle(fixture: ComponentFixture<unknown>) {
  for (let pass = 0; pass < 2; pass += 1) {
    fixture.detectChanges();
    TestBed.tick();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  TestBed.tick();
}
