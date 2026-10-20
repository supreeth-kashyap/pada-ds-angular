import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { DsPinInputParts } from './pin-input.directive';

const boxes = () => screen.getAllByRole('textbox') as HTMLInputElement[];
const values = () => boxes().map((box) => box.value);

const pin = (length: number, attributes = '') => `
  <div dsPinInput [length]="${length}" aria-label="Code" ${attributes}>
    @for (index of indexes; track index) { <input dsPinInputInput [index]="index" /> }
  </div>`;
const indexes = (length: number) => Array.from({ length }, (_, index) => index);

describe('DsPinInput', () => {
  it('is a named group of named boxes; the first accepts one-time codes', async () => {
    const { container } = await render(pin(6), {
      imports: [...DsPinInputParts],
      componentProperties: { indexes: indexes(6) },
    });
    expect(screen.getByRole('group', { name: 'Code' })).toBeInTheDocument();
    expect(boxes()).toHaveLength(6);
    expect(boxes()[0]).toHaveAccessibleName('Character 1 of 6');
    expect(boxes()[0]).toHaveAttribute('autocomplete', 'one-time-code');
    expect(boxes()[0]).toHaveAttribute('inputmode', 'numeric');
    expect(boxes()[1]).toHaveAttribute('autocomplete', 'off');
    await expectNoA11yViolations(container);
  });

  it('moves forward as you type, back with Backspace, and completes', async () => {
    const onComplete = vi.fn();
    const { container } = await render(pin(4, '(complete)="onComplete($event)"'), {
      imports: [...DsPinInputParts],
      componentProperties: { indexes: indexes(4), onComplete },
    });
    await userEvent.click(boxes()[0]);
    await userEvent.keyboard('1a2');
    expect(values()).toEqual(['1', '2', '', '']);
    expect(boxes()[2]).toHaveFocus();
    await userEvent.keyboard('{Backspace}');
    expect(boxes()[1]).toHaveFocus();
    expect(boxes()[1]).toHaveValue('');
    await userEvent.keyboard('789');
    expect(onComplete).toHaveBeenCalledWith('1789');
    expect(container.querySelector('[dsPinInput]')).toHaveAttribute('data-complete');
    await userEvent.keyboard('{Home}');
    expect(boxes()[0]).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}{Delete}');
    expect(values()).toEqual(['1', '', '8', '9']);
    await userEvent.keyboard('{End}');
    expect(boxes()[3]).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(boxes()[2]).toHaveFocus();
  });

  it('pasting a code fills every box and submits with forms', async () => {
    const onComplete = vi.fn();
    const { container } = await render(
      `<form>${pin(6, 'name="code" (complete)="onComplete($event)"')}</form>`,
      { imports: [...DsPinInputParts], componentProperties: { indexes: indexes(6), onComplete } },
    );
    await userEvent.click(boxes()[2]);
    await userEvent.paste('482 913');
    expect(onComplete).toHaveBeenCalledWith('482913');
    expect(new FormData(container.querySelector('form')!).get('code')).toBe('482913');
  });

  it('masks alphanumeric codes', async () => {
    await render(pin(3, 'type="alphanumeric" mask'), {
      imports: [...DsPinInputParts],
      componentProperties: { indexes: indexes(3) },
    });
    const first = screen.getByLabelText('Character 1 of 3');
    expect(first).toHaveAttribute('type', 'password');
    await userEvent.type(first, 'aB');
    expect(screen.getByLabelText('Character 2 of 3')).toHaveValue('B');
  });

  it('works with reactive forms and ngModel', async () => {
    const control = new FormControl('12');
    const { fixture } = await render(
      `<div dsPinInput [length]="3" aria-label="A" [formControl]="control">
         @for (index of indexes; track index) { <input dsPinInputInput [index]="index" /> }
       </div>
       <div dsPinInput [length]="2" aria-label="B" [(ngModel)]="other">
         @for (index of [0, 1]; track index) { <input dsPinInputInput [index]="index" [attr.data-b]="index" /> }
       </div>`,
      {
        imports: [...DsPinInputParts, ReactiveFormsModule, FormsModule],
        componentProperties: { control, indexes: indexes(3), other: '' },
      },
    );
    await fixture.whenStable();
    const group = screen.getByRole('group', { name: 'A' });
    const a = Array.from(group.querySelectorAll('input'));
    expect(a.map((box) => box.value)).toEqual(['1', '2', '']);
    await userEvent.click(a[2]);
    await userEvent.keyboard('3');
    await userEvent.tab();
    expect(control.value).toBe('123');
    expect(control.touched).toBe(true);
    control.disable();
    await fixture.whenStable();
    expect(a[0]).toBeDisabled();

    const b = Array.from(screen.getByRole('group', { name: 'B' }).querySelectorAll('input'));
    await userEvent.click(b[0]);
    await userEvent.keyboard('45');
    expect((fixture.componentInstance as unknown as { other: string }).other).toBe('45');
  });
});
