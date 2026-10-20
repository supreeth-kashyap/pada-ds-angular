import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { ToggleComponent } from './toggle';

describe('ToggleComponent', () => {
  it('reports aria-pressed, size and an icon', async () => {
    const onPressedChange = vi.fn();
    const { container } = await render(
      `<button dsToggle size="sm" icon="add" (pressedChange)="onPressedChange($event)">Bold</button>`,
      { imports: [ToggleComponent], componentProperties: { onPressedChange } },
    );
    const toggle = screen.getByRole('button', { name: 'Bold' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveAttribute('data-size', 'sm');
    expect(toggle).toHaveClass('toggle');
    await waitFor(() => expect(toggle.querySelector('ds-icon svg')).not.toBeNull());
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveAttribute('data-state', 'on');
    expect(onPressedChange).toHaveBeenCalledWith(true);
    await expectNoA11yViolations(container);
  });

  it('two-way binds pressed and works with reactive forms and ngModel', async () => {
    const control = new FormControl(false);
    const { fixture } = await render(
      `<button dsToggle [(pressed)]="a">A</button>
       <button dsToggle [formControl]="control">B</button>
       <button dsToggle [(ngModel)]="c">C</button>`,
      {
        imports: [ToggleComponent, ReactiveFormsModule, FormsModule],
        componentProperties: { a: true, control, c: false },
      },
    );
    await fixture.whenStable();
    const host = fixture.componentInstance as unknown as { a: boolean; c: boolean };
    await userEvent.click(screen.getByRole('button', { name: 'A' }));
    expect(host.a).toBe(false);
    const b = screen.getByRole('button', { name: 'B' });
    await userEvent.click(b);
    expect(control.value).toBe(true);
    control.disable();
    await fixture.whenStable();
    expect(b).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'C' }));
    expect(host.c).toBe(true);
  });
});
