import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { SheetParts } from './sheet';

interface Options {
  snapPoints?: number[];
  dismissible?: boolean;
}

async function setup({ snapPoints, dismissible = true }: Options = {}) {
  const onOpenChange = vi.fn();
  const onSnapChange = vi.fn();
  const result = await render(
    `<ds-sheet [open]="true" (openChange)="onOpenChange($event)">
       <button dsDialogTrigger>Open</button>
       <ds-sheet-content
         [snapPoints]="snapPoints"
         [dismissible]="dismissible"
         (snapChange)="onSnapChange($event)"
       >
         <ds-dialog-header>
           <ds-dialog-title>Share</ds-dialog-title>
           <ds-dialog-description>Send a link to this page.</ds-dialog-description>
         </ds-dialog-header>
         <ds-dialog-body><input aria-label="Email" /></ds-dialog-body>
       </ds-sheet-content>
     </ds-sheet>`,
    {
      imports: [...SheetParts],
      componentProperties: { snapPoints, dismissible, onOpenChange, onSnapChange },
    },
  );
  await settle(result.fixture);
  const sheet = screen.getByRole('dialog');
  // Drags in even steps over `duration` ms of a mocked clock, so release velocity is predictable.
  const drag = (
    element: HTMLElement,
    from: number,
    to: number,
    { steps = 4, duration = 400 } = {},
  ) => {
    let clock = 0;
    const now = vi.spyOn(performance, 'now').mockImplementation(() => clock);
    fireEvent.pointerDown(element, { button: 0, clientY: from, pointerId: 1 });
    for (let step = 1; step <= steps; step += 1) {
      clock = (duration * step) / steps;
      fireEvent.pointerMove(element, {
        clientY: from + ((to - from) * step) / steps,
        pointerId: 1,
      });
    }
    fireEvent.pointerUp(element, { clientY: to, pointerId: 1 });
    now.mockRestore();
    result.fixture.detectChanges();
  };
  return { ...result, sheet, drag, onOpenChange, onSnapChange };
}

describe('Sheet', () => {
  it('opens as a labelled modal dialog', async () => {
    const { fixture, sheet } = await setup();
    expect(sheet).toHaveAccessibleName('Share');
    expect(sheet.tagName).toBe('DIALOG');
    expect(sheet).toHaveAttribute('aria-modal', 'true');
    expect(sheet).toHaveAccessibleDescription('Send a link to this page.');
    expect(sheet).not.toHaveAttribute('data-snap');
    expect(sheet.querySelector('.sheet-grabber')).toHaveAttribute('aria-hidden', 'true');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('closes when dragged down far enough, and springs back otherwise', async () => {
    const { sheet, drag, onOpenChange, fixture } = await setup();
    sheet.getBoundingClientRect = () => ({ height: 400, width: 600, top: 368, left: 0 }) as DOMRect;
    let clock = 0;
    const now = vi.spyOn(performance, 'now').mockImplementation(() => clock);
    fireEvent.pointerDown(sheet, { button: 0, clientY: 400, pointerId: 1 });
    clock = 1000;
    fireEvent.pointerMove(sheet, { clientY: 450, pointerId: 1 });
    fixture.detectChanges();
    expect(sheet).toHaveAttribute('data-dragging');
    expect(sheet.style.getPropertyValue('--pada-sheet-drag')).toBe('50px');
    clock = 2000;
    fireEvent.pointerUp(sheet, { clientY: 450, pointerId: 1 });
    now.mockRestore();
    fixture.detectChanges();
    expect(sheet).not.toHaveAttribute('data-dragging');

    drag(sheet, 400, 450, { duration: 1000 });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(sheet.style.getPropertyValue('--pada-sheet-drag')).toBe('0px');
    drag(sheet, 400, 600, { duration: 1000 });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes on a quick flick down', async () => {
    const { sheet, drag, onOpenChange } = await setup();
    sheet.getBoundingClientRect = () => ({ height: 400 }) as DOMRect;
    drag(sheet, 400, 460, { duration: 60 });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close when not dismissible', async () => {
    const { sheet, drag, onOpenChange } = await setup({ dismissible: false });
    sheet.getBoundingClientRect = () => ({ height: 400 }) as DOMRect;
    drag(sheet, 400, 700, { duration: 60 });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('does not drag from form controls', async () => {
    const { sheet, drag, onOpenChange } = await setup();
    drag(screen.getByRole('textbox', { name: 'Email' }), 400, 700);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(sheet).not.toHaveAttribute('data-dragging');
  });

  it('moves between snap points by dragging and with the grabber', async () => {
    const { sheet, drag, onSnapChange, fixture } = await setup({
      snapPoints: [0.4, 0.9],
      dismissible: false,
    });
    expect(sheet).toHaveAttribute('data-snap', '0.4');
    expect(sheet.style.getPropertyValue('--pada-sheet-height')).toBe('90dvh');
    expect(sheet.style.getPropertyValue('--pada-sheet-offset')).toBe(
      `${0.5 * window.innerHeight}px`,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Expand sheet' }));
    await settle(fixture);
    expect(onSnapChange).toHaveBeenLastCalledWith(0.9);
    expect(sheet).toHaveAttribute('data-snap', '0.9');
    expect(screen.getByRole('button', { name: 'Collapse sheet' })).toBeInTheDocument();
    // A slow drag down by most of the viewport settles at the nearest point, never closing.
    drag(sheet, 100, 100 + window.innerHeight * 0.45, { duration: 2000 });
    expect(onSnapChange).toHaveBeenLastCalledWith(0.4);
    drag(sheet, 300, 300 + window.innerHeight * 0.6, { duration: 2000 });
    expect(sheet).toHaveAttribute('data-snap', '0.4');
    // A quick flick up moves one point up.
    drag(sheet, 500, 400, { duration: 50 });
    expect(sheet).toHaveAttribute('data-snap', '0.9');
  });

  it('resists dragging up past the highest snap point', async () => {
    const { sheet, fixture } = await setup({ snapPoints: [0.4, 0.9] });
    const room = 0.5 * window.innerHeight;
    fireEvent.pointerDown(sheet, { button: 0, clientY: 600, pointerId: 1 });
    fireEvent.pointerMove(sheet, { clientY: 600 - room - 100, pointerId: 1 });
    fixture.detectChanges();
    expect(sheet.style.getPropertyValue('--pada-sheet-drag')).toBe(`${-room - 25}px`);
    fireEvent.pointerCancel(sheet, { pointerId: 1 });
    fixture.detectChanges();
    expect(sheet.style.getPropertyValue('--pada-sheet-drag')).toBe('0px');
  });

  it('does not cycle from the click that ends a drag on the grabber', async () => {
    const { drag, onSnapChange, fixture } = await setup({ snapPoints: [0.4, 0.9] });
    const grabber = screen.getByRole('button', { name: 'Expand sheet' });
    drag(grabber, 400, 410, { duration: 1000 });
    fireEvent.click(grabber);
    await settle(fixture);
    expect(onSnapChange).not.toHaveBeenCalled();
    fireEvent.click(grabber);
    await settle(fixture);
    expect(onSnapChange).toHaveBeenLastCalledWith(0.9);
  });

  it('closes with Escape like any dialog', async () => {
    const { onOpenChange } = await setup();
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
