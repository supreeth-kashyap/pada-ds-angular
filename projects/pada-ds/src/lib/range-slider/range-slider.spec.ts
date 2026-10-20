import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { RangeSliderComponent } from './range-slider';

describe('RangeSliderComponent', () => {
  it('exposes two named sliders bounded by each other', async () => {
    const { container } = await render(
      `<ds-range-slider label="Price" [value]="[20, 80]" locale="en-US" description="Per night."
         [formatOptions]="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }" />`,
      { imports: [RangeSliderComponent] },
    );
    expect(screen.getByRole('group', { name: 'Price' })).toBeInTheDocument();
    const [low, high] = screen.getAllByRole('slider');
    expect(low).toHaveAccessibleName('Minimum price');
    expect(low).toHaveAttribute('aria-valuemax', '80');
    expect(high).toHaveAttribute('aria-valuemin', '20');
    expect(high).toHaveAttribute('aria-valuetext', '$80');
    expect(high).toHaveAccessibleDescription('Per night.');
    expect(screen.getByText('$20 – $80')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('steps with the keyboard and never crosses the other thumb', async () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    await render(
      `<ds-range-slider label="Size" [value]="[40, 50]" [minStepsBetweenThumbs]="5"
         (valueChange)="onValueChange($event)" (valueCommit)="onValueCommit($event)" />`,
      { imports: [RangeSliderComponent], componentProperties: { onValueChange, onValueCommit } },
    );
    const [low, high] = screen.getAllByRole('slider');
    low.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith([41, 50]);
    expect(onValueCommit).toHaveBeenLastCalledWith([41, 50]);
    await userEvent.keyboard('{End}');
    expect(low).toHaveAttribute('aria-valuenow', '45');
    await userEvent.keyboard('{PageDown}');
    expect(low).toHaveAttribute('aria-valuenow', '35');
    high.focus();
    await userEvent.keyboard('{Home}');
    expect(high).toHaveAttribute('aria-valuenow', '40');
    await userEvent.keyboard('{PageUp}');
    expect(high).toHaveAttribute('aria-valuenow', '50');
  });

  it('pressing the track moves the nearest thumb and drags it', async () => {
    const onValueCommit = vi.fn();
    const { container } = await render(
      `<ds-range-slider label="Range" [value]="[20, 80]" (valueCommit)="onValueCommit($event)" />`,
      { imports: [RangeSliderComponent], componentProperties: { onValueCommit } },
    );
    const track = container.querySelector<HTMLElement>('.range-slider-track')!;
    track.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 200, height: 12 });
    const root = container.querySelector<HTMLElement>('.range-slider-root')!;
    fireEvent.pointerDown(root, { button: 0, clientX: 140, pointerId: 1 });
    const [, high] = screen.getAllByRole('slider');
    expect(high).toHaveAttribute('aria-valuenow', '70');
    expect(high).toHaveFocus();
    fireEvent.pointerMove(root, { clientX: 190, pointerId: 1 });
    fireEvent.pointerUp(root, { clientX: 190, pointerId: 1 });
    expect(onValueCommit).toHaveBeenCalledWith([20, 95]);
  });

  it('defaults to the full range, shows errors, and submits both values', async () => {
    const { container } = await render(
      `<form><ds-range-slider label="Age" [min]="18" [max]="65" name="age" error="Too wide." [thumbLabels]="['From', 'To']" /></form>`,
      { imports: [RangeSliderComponent] },
    );
    expect(screen.getByRole('slider', { name: 'From' })).toHaveAttribute('aria-valuenow', '18');
    expect(screen.getByRole('slider', { name: 'To' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Too wide.');
    expect(new FormData(container.querySelector('form')!).getAll('age')).toEqual(['18', '65']);
  });

  it('works with reactive forms and ngModel', async () => {
    const control = new FormControl<[number, number]>([10, 90]);
    const { fixture } = await render(
      `<ds-range-slider label="A" [formControl]="control" />
       <ds-range-slider label="B" [(ngModel)]="b" />`,
      {
        imports: [RangeSliderComponent, ReactiveFormsModule, FormsModule],
        componentProperties: { control, b: [30, 40] },
      },
    );
    await fixture.whenStable();
    const low = screen.getByRole('slider', { name: 'Minimum a' });
    expect(low).toHaveAttribute('aria-valuenow', '10');
    low.focus();
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.tab();
    expect(control.value).toEqual([11, 90]);
    expect(control.touched).toBe(true);
    control.disable();
    await fixture.whenStable();
    expect(low).toHaveAttribute('aria-disabled', 'true');
    screen.getByRole('slider', { name: 'Maximum b' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect((fixture.componentInstance as unknown as { b: number[] }).b).toEqual([30, 39]);
  });
});
