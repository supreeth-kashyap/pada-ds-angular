import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { DsSliderParts } from './slider.directive';

const RANGE = `
  <span dsSlider class="root" role="group" aria-label="Range" [(value)]="value" [min]="0" [max]="100"
        [minStepsBetweenThumbs]="gap" name="range" (valueCommit)="onCommit($event)">
    <span dsSliderTrack class="track"><span dsSliderRange class="range"></span></span>
    <span dsSliderThumb [index]="0" aria-label="Minimum"></span>
    <span dsSliderThumb [index]="1" aria-label="Maximum"></span>
  </span>`;

describe('DsSlider', () => {
  it('exposes named sliders bounded by each other, with position properties', async () => {
    const { container } = await render(`<form>${RANGE}</form>`, {
      imports: [...DsSliderParts],
      componentProperties: { value: [20, 80], gap: 0, onCommit: vi.fn() },
    });
    const [low, high] = screen.getAllByRole('slider');
    expect(low).toHaveAccessibleName('Minimum');
    expect(low).toHaveAttribute('aria-valuemax', '80');
    expect(high).toHaveAttribute('aria-valuemin', '20');
    expect(high).toHaveAttribute('aria-orientation', 'horizontal');
    expect(low.style.getPropertyValue('--pada-slider-thumb-position')).toBe('20%');
    const range = container.querySelector<HTMLElement>('.range')!;
    expect(range.style.getPropertyValue('--pada-slider-range-start')).toBe('20%');
    expect(range.style.getPropertyValue('--pada-slider-range-end')).toBe('80%');
    const form = container.querySelector('form')!;
    expect(new FormData(form).getAll('range')).toEqual(['20', '80']);
    await expectNoA11yViolations(container);
  });

  it('steps with the keyboard and never crosses the other thumb', async () => {
    const onCommit = vi.fn();
    const { fixture } = await render(RANGE, {
      imports: [...DsSliderParts],
      componentProperties: { value: [40, 50], gap: 5, onCommit },
    });
    const [low, high] = screen.getAllByRole('slider');
    low.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect((fixture.componentInstance as unknown as { value: number[] }).value).toEqual([41, 50]);
    expect(onCommit).toHaveBeenLastCalledWith([41, 50]);
    await userEvent.keyboard('{End}');
    expect(low).toHaveAttribute('aria-valuenow', '45');
    await userEvent.keyboard('{PageDown}');
    expect(low).toHaveAttribute('aria-valuenow', '35');
    await userEvent.keyboard('{ArrowUp}{ArrowDown}{ArrowLeft}');
    expect(low).toHaveAttribute('aria-valuenow', '34');
    high.focus();
    await userEvent.keyboard('{Home}');
    expect(high).toHaveAttribute('aria-valuenow', '39');
    await userEvent.keyboard('{PageUp}');
    expect(high).toHaveAttribute('aria-valuenow', '49');
  });

  it('pressing the track moves the nearest thumb and drags it', async () => {
    const onCommit = vi.fn();
    const { container } = await render(RANGE, {
      imports: [...DsSliderParts],
      componentProperties: { value: [20, 80], gap: 0, onCommit },
    });
    const track = container.querySelector<HTMLElement>('.track')!;
    track.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 200, height: 12 });
    const root = container.querySelector<HTMLElement>('.root')!;
    fireEvent.pointerDown(root, { button: 0, clientX: 140, pointerId: 1 });
    const [, high] = screen.getAllByRole('slider');
    expect(high).toHaveAttribute('aria-valuenow', '70');
    expect(high).toHaveFocus();
    fireEvent.pointerMove(root, { clientX: 190, pointerId: 1 });
    fireEvent.pointerUp(root, { clientX: 190, pointerId: 1 });
    expect(onCommit).toHaveBeenCalledWith([20, 95]);
  });

  it('supports vertical, right-to-left and disabled sliders', async () => {
    const { rerender, container } = await render(
      `<span dsSlider class="root" [orientation]="orientation" [dir]="dir" [disabled]="disabled" [value]="[50]" [step]="5">
         <span dsSliderTrack class="track"></span>
         <span dsSliderThumb aria-label="Volume"></span>
       </span>`,
      {
        imports: [...DsSliderParts],
        componentProperties: { orientation: 'horizontal', dir: 'rtl', disabled: false },
      },
    );
    const thumb = screen.getByRole('slider', { name: 'Volume' });
    thumb.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(thumb).toHaveAttribute('aria-valuenow', '55');
    const track = container.querySelector<HTMLElement>('.track')!;
    track.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 100, height: 100 });
    fireEvent.pointerDown(container.querySelector('.root')!, {
      button: 0,
      clientX: 20,
      clientY: 0,
    });
    expect(thumb).toHaveAttribute('aria-valuenow', '80');

    await rerender({
      componentProperties: { orientation: 'vertical', dir: 'ltr', disabled: true },
    });
    expect(thumb).toHaveAttribute('aria-orientation', 'vertical');
    expect(thumb).toHaveAttribute('aria-disabled', 'true');
    expect(thumb).not.toHaveAttribute('tabindex');
  });

  it('works with reactive forms and ngModel', async () => {
    const control = new FormControl([30]);
    const { fixture } = await render(
      `<span dsSlider [formControl]="control"><span dsSliderThumb aria-label="Level"></span></span>
       <span dsSlider [(ngModel)]="level"><span dsSliderThumb aria-label="Other"></span></span>`,
      {
        imports: [...DsSliderParts, ReactiveFormsModule, FormsModule],
        componentProperties: { control, level: [10] },
      },
    );
    await fixture.whenStable();
    const thumb = screen.getByRole('slider', { name: 'Level' });
    expect(thumb).toHaveAttribute('aria-valuenow', '30');
    thumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.tab();
    expect(control.value).toEqual([31]);
    expect(control.touched).toBe(true);
    control.disable();
    await fixture.whenStable();
    expect(thumb).toHaveAttribute('aria-disabled', 'true');

    const other = screen.getByRole('slider', { name: 'Other' });
    expect(other).toHaveAttribute('aria-valuenow', '10');
    other.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect((fixture.componentInstance as unknown as { level: number[] }).level).toEqual([11]);
  });
});
