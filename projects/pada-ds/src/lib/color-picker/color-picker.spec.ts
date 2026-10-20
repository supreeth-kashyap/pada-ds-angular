import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { parseColor } from './color';
import { ColorPickerComponent } from './color-picker';

// jsdom has no canvas: a 2D context that records what the area paints.
const putImageData = vi.fn();
const originalGetContext = HTMLCanvasElement.prototype.getContext;
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    createImageData: (width: number, height: number) => ({
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4),
    }),
    putImageData,
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});
afterAll(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
});

const area = () => screen.getByRole('slider', { name: 'Lightness and chroma' });

describe('ColorPickerComponent', () => {
  it('exposes a labelled group with a 2D slider, a hue slider and a hex field', async () => {
    const { container } = await render(
      `<ds-color-picker label="Accent colour" value="#4f46e5" [swatches]="['#ef4444', { value: '#4f46e5', label: 'Indigo' }]" />`,
      { imports: [ColorPickerComponent] },
    );
    expect(screen.getByRole('group', { name: 'Accent colour' })).toBeInTheDocument();
    expect(area()).toHaveAttribute('aria-roledescription', '2D slider');
    expect(area().getAttribute('aria-valuetext')).toMatch(/^Lightness 51%, chroma 0\.2\d\d$/);
    expect(screen.getByRole('slider', { name: 'Hue' })).toHaveAttribute('aria-valuenow', '277');
    expect(screen.getByRole('textbox', { name: 'Hex' })).toHaveValue('#4f46e5');
    expect(screen.getByRole('button', { name: 'Indigo' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '#ef4444' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('status', { name: 'OKLCH' }).textContent).toMatch(
      /^51\.\d% 0\.2\d+ 277/,
    );
    const host = container.querySelector<HTMLElement>('ds-color-picker')!;
    expect(host.style.getPropertyValue('--pada-color-picker-value')).toBe('#4f46e5');
    // The area is painted at 96×64 for the current hue.
    expect(putImageData).toHaveBeenCalled();
    expect(putImageData.mock.lastCall![0].width).toBe(96);
    await expectNoA11yViolations(container);
  });

  it('moves lightness and chroma with the arrow keys', async () => {
    const onValueChange = vi.fn();
    await render(
      `<ds-color-picker label="Colour" value="oklch(50% 0.1 200)" format="oklch" (valueChange)="onValueChange($event)" />`,
      { imports: [ColorPickerComponent], componentProperties: { onValueChange } },
    );
    area().focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(onValueChange).toHaveBeenLastCalledWith('oklch(51% 0.1 200)');
    await userEvent.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith('oklch(51% 0.105 200)');
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    expect(onValueChange).toHaveBeenLastCalledWith('oklch(41% 0.105 200)');
    await userEvent.keyboard('{Home}');
    expect(onValueChange).toHaveBeenLastCalledWith('oklch(41% 0 200)');
    await userEvent.keyboard('{PageUp}');
    expect(onValueChange).toHaveBeenLastCalledWith('oklch(51% 0 200)');
  });

  it('changes hue with its slider', async () => {
    const onValueChange = vi.fn();
    await render(
      `<ds-color-picker label="Colour" value="oklch(60% 0.1 100)" format="oklch" (valueChange)="onValueChange($event)" />`,
      { imports: [ColorPickerComponent], componentProperties: { onValueChange } },
    );
    screen.getByRole('slider', { name: 'Hue' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith('oklch(60% 0.1 101)');
    expect(screen.getByRole('slider', { name: 'Hue' })).toHaveAttribute(
      'aria-valuetext',
      'Hue 101°',
    );
  });

  it('picks from the area with the pointer', async () => {
    const onValueChange = vi.fn();
    await render(
      `<ds-color-picker label="Colour" value="oklch(50% 0.1 30)" format="oklch" (valueChange)="onValueChange($event)" />`,
      { imports: [ColorPickerComponent], componentProperties: { onValueChange } },
    );
    const box = area().parentElement!;
    box.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect;
    fireEvent.pointerDown(box, { button: 0, clientX: 0, clientY: 25, pointerId: 1 });
    expect(onValueChange).toHaveBeenLastCalledWith('oklch(75% 0 30)');
    expect(area()).toHaveFocus();
    fireEvent.pointerMove(box, { clientX: 100, clientY: 50, pointerId: 1 });
    expect(onValueChange).toHaveBeenLastCalledWith('oklch(50% 0.185 30)');
    fireEvent.pointerUp(box, { pointerId: 1 });
    fireEvent.pointerMove(box, { clientX: 200, clientY: 0, pointerId: 1 });
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it('accepts typed hex on Enter, reverts on Escape, and reverts invalid input on blur', async () => {
    const onValueChange = vi.fn();
    await render(`<ds-color-picker label="Colour" (valueChange)="onValueChange($event)" />`, {
      imports: [ColorPickerComponent],
      componentProperties: { onValueChange },
    });
    const input = screen.getByRole('textbox', { name: 'Hex' });
    await userEvent.clear(input);
    await userEvent.type(input, '#f00{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('#ff0000');
    expect(input).toHaveValue('#ff0000');
    await userEvent.clear(input);
    await userEvent.type(input, '#00f{Escape}');
    expect(input).toHaveValue('#ff0000');
    await userEvent.clear(input);
    await userEvent.type(input, 'nope');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    await userEvent.tab();
    expect(input).toHaveValue('#ff0000');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('chooses a swatch, follows a controlled value, and ignores its own echo', async () => {
    @Component({
      imports: [ColorPickerComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: ` <ds-color-picker
          label="Colour"
          [value]="value()"
          (valueChange)="value.set($event)"
          [swatches]="['#ef4444', '#22c55e']"
        />
        <button type="button" (click)="value.set('#4f46e5')">Reset</button>
        <span data-testid="value">{{ value() }}</span>`,
    })
    class Controlled {
      readonly value = signal('#22c55e');
    }
    await render(Controlled);
    expect(screen.getByRole('button', { name: '#22c55e' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: '#ef4444' }));
    expect(screen.getByTestId('value')).toHaveTextContent('#ef4444');
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('textbox', { name: 'Hex' })).toHaveValue('#4f46e5');
    const hue = screen.getByRole('slider', { name: 'Hue' });
    expect(hue).toHaveAttribute('aria-valuenow', String(Math.round(parseColor('#4f46e5')!.h)));

    // Chroma 0 emits a grey hex, which would parse back with hue 0; the echo keeps the hue.
    area().focus();
    await userEvent.keyboard('{Home}');
    expect(parseColor(screen.getByTestId('value').textContent!)!.c).toBeLessThan(1e-3);
    expect(hue).toHaveAttribute('aria-valuenow', '277');
  });

  it('works with reactive forms and ngModel', async () => {
    const control = new FormControl('#22c55e');
    const { fixture } = await render(
      `<ds-color-picker label="A" [formControl]="control" />
       <ds-color-picker label="B" format="oklch" [(ngModel)]="b" />`,
      {
        imports: [ColorPickerComponent, ReactiveFormsModule, FormsModule],
        componentProperties: { control, b: 'oklch(60% 0.1 100)' },
      },
    );
    await fixture.whenStable();
    const [a, b] = screen.getAllByRole('textbox', { name: 'Hex' });
    expect(a).toHaveValue('#22c55e');
    await userEvent.clear(a);
    await userEvent.type(a, '#123456');
    await userEvent.tab();
    expect(control.value).toBe('#123456');
    expect(control.touched).toBe(true);
    control.setValue('#ffffff');
    await fixture.whenStable();
    expect(a).toHaveValue('#ffffff');
    control.disable();
    await fixture.whenStable();
    expect(a).toBeDisabled();
    expect(screen.getAllByRole('slider', { name: 'Lightness and chroma' })[0]).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    screen.getAllByRole('slider', { name: 'Hue' })[1].focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect((fixture.componentInstance as unknown as { b: string }).b).toBe('oklch(60% 0.1 99)');
    expect(b).toHaveValue(fixture.nativeElement.querySelectorAll('.color-picker-input')[1].value);
  });
});
