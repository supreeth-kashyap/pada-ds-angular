import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { FieldParts } from '../field/field';
import { SliderComponent } from './slider';

describe('SliderComponent', () => {
  it('is a labelled, described slider showing its value', async () => {
    const { container } = await render(
      `<ds-slider label="Volume" description="Applies to every device." showValue [value]="40" required />`,
      { imports: [SliderComponent] },
    );
    const slider = screen.getByRole('slider', { name: 'Volume' });
    expect(slider).toHaveAttribute('aria-valuenow', '40');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAccessibleDescription('Applies to every device.');
    expect(container.querySelector('.slider-value')).toHaveTextContent('40');
    expect(container.querySelector('.slider-required')).not.toBeNull();
    await expectNoA11yViolations(container);
  });

  it('steps with arrows, PageUp/PageDown and Home/End, and two-way binds the value', async () => {
    const onCommit = vi.fn();
    const { fixture } = await render(
      `<ds-slider aria-label="Zoom" [min]="10" [max]="200" [step]="5" [(value)]="zoom" (valueCommit)="onCommit($event)" />`,
      { imports: [SliderComponent], componentProperties: { zoom: 100, onCommit } },
    );
    const host = fixture.componentInstance as unknown as { zoom: number };
    const slider = screen.getByRole('slider', { name: 'Zoom' });
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(host.zoom).toBe(105);
    expect(onCommit).toHaveBeenLastCalledWith(105);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(host.zoom).toBe(95);
    await userEvent.keyboard('{PageUp}');
    expect(host.zoom).toBe(145);
    await userEvent.keyboard('{PageDown}{PageDown}');
    expect(host.zoom).toBe(45);
    await userEvent.keyboard('{End}');
    expect(slider).toHaveAttribute('aria-valuenow', '200');
    await userEvent.keyboard('{Home}');
    expect(host.zoom).toBe(10);
  });

  it('pressing and dragging on the track moves the thumb', async () => {
    const { fixture, container } = await render(`<ds-slider label="Level" [(value)]="level" />`, {
      imports: [SliderComponent],
      componentProperties: { level: 0 },
    });
    const track = container.querySelector<HTMLElement>('.slider-track')!;
    track.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 200, height: 12 });
    const root = container.querySelector<HTMLElement>('.slider-root')!;
    fireEvent.pointerDown(root, { button: 0, clientX: 50, pointerId: 1 });
    expect(screen.getByRole('slider')).toHaveFocus();
    fireEvent.pointerMove(root, { clientX: 150, pointerId: 1 });
    fireEvent.pointerUp(root, { clientX: 150, pointerId: 1 });
    expect((fixture.componentInstance as unknown as { level: number }).level).toBe(75);
  });

  it('shows an error and marks the slider invalid', async () => {
    const { container } = await render(
      `<ds-slider label="Budget" description="Monthly." error="Too high." [value]="90" />`,
      { imports: [SliderComponent] },
    );
    const slider = screen.getByRole('slider', { name: 'Budget' });
    expect(slider).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Too high.');
    expect(slider).toHaveAccessibleDescription('Too high.');
    expect(container.querySelector('.slider')).toHaveAttribute('data-invalid');
  });

  it('works with reactive forms, ngModel and native forms', async () => {
    const control = new FormControl(20, Validators.max(50));
    const { fixture, container } = await render(
      `<form>
         <ds-slider label="A" error="At most 50." [formControl]="control" />
         <ds-slider label="B" name="b" [(ngModel)]="b" [ngModelOptions]="{ standalone: true }" />
       </form>`,
      {
        imports: [SliderComponent, ReactiveFormsModule, FormsModule],
        componentProperties: { control, b: 5 },
      },
    );
    await fixture.whenStable();
    const a = screen.getByRole('slider', { name: 'A' });
    expect(a).toHaveAttribute('aria-valuenow', '20');
    a.focus();
    await userEvent.keyboard('{PageUp}{PageUp}{PageUp}{ArrowRight}');
    await userEvent.tab();
    expect(control.value).toBe(51);
    expect(control.touched).toBe(true);
    expect(screen.getByRole('alert')).toHaveTextContent('At most 50.');
    control.setValue(10);
    await fixture.whenStable();
    expect(a).toHaveAttribute('aria-valuenow', '10');
    control.disable();
    await fixture.whenStable();
    expect(a).toHaveAttribute('aria-disabled', 'true');

    const b = screen.getByRole('slider', { name: 'B' });
    b.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect((fixture.componentInstance as unknown as { b: number }).b).toBe(6);
    expect(new FormData(container.querySelector('form')!).get('b')).toBe('6');
  });

  it('inside a ds-field, takes the field id and description', async () => {
    await render(
      `<ds-field>
         <ds-field-label>Opacity</ds-field-label>
         <ds-slider aria-label="Opacity" />
         <ds-field-description>Of the overlay.</ds-field-description>
       </ds-field>`,
      { imports: [SliderComponent, ...FieldParts] },
    );
    const slider = screen.getByRole('slider', { name: 'Opacity' });
    expect(slider).toHaveAccessibleDescription('Of the overlay.');
    expect(slider.id).toBe(document.querySelector('label')!.getAttribute('for'));
  });
});
