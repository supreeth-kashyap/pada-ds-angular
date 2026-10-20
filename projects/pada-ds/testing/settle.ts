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

/**
 * Settles repeatedly until `assertion` stops throwing, for state a real timer brings about
 * (a hover delay, a toast running out). Fixed waits break on a busy machine.
 */
export async function settleUntil(
  fixture: ComponentFixture<unknown>,
  assertion: () => void,
  timeout = 3000,
) {
  const deadline = Date.now() + timeout;
  for (;;) {
    await settle(fixture);
    try {
      assertion();
      return;
    } catch (error) {
      if (Date.now() > deadline) throw error;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
}
