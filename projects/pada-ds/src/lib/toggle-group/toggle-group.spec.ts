import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { ToggleGroupParts } from './toggle-group';

describe('ToggleGroup', () => {
  it('single groups have one tab stop, arrow keys, and at most one pressed item', async () => {
    const onValueChange = vi.fn();
    const { container } = await render(
      `<ds-toggle-group type="single" value="list" size="lg" aria-label="View" (valueChange)="onValueChange($event)">
         <button dsToggleGroupItem value="list">List</button>
         <button dsToggleGroupItem value="board">Board</button>
         <button dsToggleGroupItem value="table" disabled>Table</button>
       </ds-toggle-group>
       <button type="button">After</button>`,
      { imports: [...ToggleGroupParts], componentProperties: { onValueChange } },
    );
    const group = screen.getByRole('group', { name: 'View' });
    expect(group).toHaveAttribute('data-size', 'lg');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'List' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Board' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'List' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}{Enter}');
    expect(screen.getByRole('button', { name: 'Board' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'false');
    expect(onValueChange).toHaveBeenLastCalledWith('board');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await expectNoA11yViolations(container);
  });

  it('multiple groups press any number of items and work with reactive forms', async () => {
    const control = new FormControl<string[]>([]);
    const { fixture } = await render(
      `<ds-toggle-group type="multiple" aria-label="Format" [formControl]="control">
         <button dsToggleGroupItem value="bold" icon="add">Bold</button>
         <button dsToggleGroupItem value="italic">Italic</button>
       </ds-toggle-group>`,
      { imports: [...ToggleGroupParts, ReactiveFormsModule], componentProperties: { control } },
    );
    await userEvent.click(screen.getByRole('button', { name: 'Bold' }));
    await userEvent.click(screen.getByRole('button', { name: 'Italic' }));
    expect(control.value).toEqual(['bold', 'italic']);
    control.setValue(['italic']);
    await fixture.whenStable();
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'false');
    control.disable();
    await fixture.whenStable();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeDisabled();
  });
});
