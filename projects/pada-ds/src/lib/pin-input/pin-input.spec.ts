import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { PinInputComponent } from './pin-input';

const boxes = () => screen.getAllByRole('textbox') as HTMLInputElement[];

describe('PinInputComponent', () => {
  it('is a labelled, described group of named boxes with separators', async () => {
    const { container } = await render(
      `<ds-pin-input label="Verification code" [length]="6" [groupSize]="3" description="Sent to •••• 4821" />`,
      { imports: [PinInputComponent] },
    );
    const group = screen.getByRole('group', { name: 'Verification code' });
    expect(group).toHaveAccessibleDescription('Sent to •••• 4821');
    expect(boxes()).toHaveLength(6);
    expect(boxes()[0]).toHaveAccessibleName('Character 1 of 6');
    expect(boxes()[0]).toHaveAttribute('autocomplete', 'one-time-code');
    expect(boxes()[1]).toHaveAttribute('autocomplete', 'off');
    expect(container.querySelectorAll('.pin-input-separator')).toHaveLength(1);
    await expectNoA11yViolations(container);
  });

  it('moves forward as you type, back with Backspace, and completes', async () => {
    const onComplete = vi.fn();
    await render(`<ds-pin-input label="PIN" [length]="4" (complete)="onComplete($event)" />`, {
      imports: [PinInputComponent],
      componentProperties: { onComplete },
    });
    await userEvent.click(boxes()[0]);
    await userEvent.keyboard('1a2');
    expect(boxes().map((box) => box.value)).toEqual(['1', '2', '', '']);
    expect(boxes()[2]).toHaveFocus();
    await userEvent.keyboard('{Backspace}');
    expect(boxes()[1]).toHaveFocus();
    expect(boxes()[1]).toHaveValue('');
    await userEvent.keyboard('789');
    expect(onComplete).toHaveBeenCalledWith('1789');
  });

  it('pasting a code fills every box and submits with native forms', async () => {
    const onComplete = vi.fn();
    const { container } = await render(
      `<form><ds-pin-input label="Code" [length]="6" name="code" (complete)="onComplete($event)" /></form>`,
      { imports: [PinInputComponent], componentProperties: { onComplete } },
    );
    await userEvent.click(boxes()[2]);
    await userEvent.paste('482 913');
    expect(onComplete).toHaveBeenCalledWith('482913');
    expect(new FormData(container.querySelector('form')!).get('code')).toBe('482913');
  });

  it('works with reactive forms: error once touched, disabled', async () => {
    const control = new FormControl('', [Validators.required, Validators.minLength(4)]);
    const { fixture } = await render(
      `<ds-pin-input label="PIN" [length]="4" error="Enter all 4 digits." [formControl]="control" />`,
      { imports: [PinInputComponent, ReactiveFormsModule], componentProperties: { control } },
    );
    await userEvent.click(boxes()[0]);
    await userEvent.keyboard('12');
    await userEvent.tab();
    expect(control.value).toBe('12');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter all 4 digits.');
    expect(boxes()[0]).toHaveAttribute('aria-invalid', 'true');
    control.setValue('9876');
    await fixture.whenStable();
    expect(boxes().map((box) => box.value)).toEqual(['9', '8', '7', '6']);
    control.disable();
    await fixture.whenStable();
    expect(boxes()[0]).toBeDisabled();
  });

  it('works with ngModel', async () => {
    const { fixture } = await render(
      `<ds-pin-input label="PIN" [length]="3" mask [(ngModel)]="pin" />`,
      {
        imports: [PinInputComponent, FormsModule],
        componentProperties: { pin: '' },
      },
    );
    const first = screen.getByLabelText('Character 1 of 3');
    expect(first).toHaveAttribute('type', 'password');
    await userEvent.click(first);
    await userEvent.keyboard('42');
    expect((fixture.componentInstance as unknown as { pin: string }).pin).toBe('42');
  });
});
