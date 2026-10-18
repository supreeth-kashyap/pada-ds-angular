import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DsPresence } from '../utils/presence';
import { DsDialogParts } from './dialog.directive';

@Component({
  imports: [DsDialogParts, DsPresence],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button id="outside">Outside</button>
    <ng-container dsDialog [(open)]="open" [modal]="modal()">
      <button dsDialogTrigger>Edit profile</button>
      <dialog *dsPresence="open()" dsDialogContent (escapeKeyDown)="onEscape($event)">
        <h2 dsDialogTitle>Edit profile</h2>
        <p dsDialogDescription>Changes save automatically.</p>
        <input aria-label="Name" />
        <button dsDialogClose>Done</button>
      </dialog>
    </ng-container>
  `,
})
class Host {
  readonly open = signal(false);
  readonly modal = signal(true);
  keepOpenOnEscape = false;
  onEscape(event: { preventDefault(): void }) {
    if (this.keepOpenOnEscape) event.preventDefault();
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function setup() {
  const fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const trigger = el.querySelector<HTMLButtonElement>('[dsDialogTrigger]')!;
  const dialog = () => el.querySelector<HTMLDialogElement>('dialog');
  return { fixture, el, trigger, dialog };
}

async function settle(fixture: ComponentFixture<Host>) {
  fixture.detectChanges();
  await fixture.whenStable();
  await flush();
}

describe('DsDialog', () => {
  afterEach(() =>
    document.body
      .querySelectorAll('[ng-version], div[id^="root"]')
      .forEach((node) => node.remove()),
  );

  it('wires the trigger with ARIA and opens on click', async () => {
    const { fixture, trigger, dialog } = await setup();
    expect(trigger.getAttribute('type')).toBe('button');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(dialog()).toBeNull();

    trigger.click();
    await settle(fixture);

    const panel = dialog()!;
    expect(panel.open).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('data-state')).toBe('open');
    expect(panel.getAttribute('aria-modal')).toBe('true');
    expect(panel.getAttribute('aria-labelledby')).toBe(panel.querySelector('h2')!.id);
    expect(panel.getAttribute('aria-describedby')).toBe(panel.querySelector('p')!.id);
  });

  it('moves focus in on open and back to the trigger on close', async () => {
    const { fixture, trigger, dialog } = await setup();
    trigger.focus();
    trigger.click();
    await settle(fixture);
    expect(document.activeElement).toBe(dialog()!.querySelector('input'));

    dialog()!.querySelector<HTMLButtonElement>('[dsDialogClose]')!.click();
    await settle(fixture);
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on Escape unless the escapeKeyDown output prevents it', async () => {
    const { fixture, trigger, dialog } = await setup();
    trigger.click();
    await settle(fixture);

    fixture.componentInstance.keepOpenOnEscape = true;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle(fixture);
    expect(dialog()).not.toBeNull();

    fixture.componentInstance.keepOpenOnEscape = false;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle(fixture);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(dialog()).toBeNull();
  });

  it('closes on a pointer-down outside', async () => {
    const { fixture, el, trigger } = await setup();
    trigger.click();
    await settle(fixture);
    el.querySelector('#outside')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await settle(fixture);
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('traps Tab inside a modal dialog', async () => {
    const { fixture, trigger, dialog } = await setup();
    trigger.click();
    await settle(fixture);
    const close = dialog()!.querySelector<HTMLButtonElement>('[dsDialogClose]')!;
    close.focus();
    close.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(dialog()!.querySelector('input'));
  });

  it('locks page scroll while a modal dialog is open', async () => {
    const { fixture, trigger } = await setup();
    trigger.click();
    await settle(fixture);
    expect(document.body.style.overflow).toBe('hidden');
    fixture.componentInstance.open.set(false);
    await settle(fixture);
    expect(document.body.style.overflow).toBe('');
  });

  it('syncs when the browser closes the dialog itself', async () => {
    const { fixture, trigger, dialog } = await setup();
    trigger.click();
    await settle(fixture);
    dialog()!.close();
    await settle(fixture);
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('closes a non-modal dialog when focus leaves it', async () => {
    const { fixture, el, trigger, dialog } = await setup();
    fixture.componentInstance.modal.set(false);
    trigger.click();
    await settle(fixture);
    expect(dialog()!.hasAttribute('aria-modal')).toBe(false);
    el.querySelector<HTMLButtonElement>('#outside')!.focus();
    await settle(fixture);
    expect(fixture.componentInstance.open()).toBe(false);
  });
});
