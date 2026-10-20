import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { DsToggle, DsToggleGroupParts } from './toggle.directive';

describe('DsToggle', () => {
  it('reports aria-pressed and data-state, and two-way binds pressed', async () => {
    const { fixture } = await render(
      `<button dsToggle [(pressed)]="bold" (pressedChange)="changed($event)">Bold</button>`,
      { imports: [DsToggle], componentProperties: { bold: false, changed: vi.fn() } },
    );
    const toggle = screen.getByRole('button', { name: 'Bold' });
    expect(toggle).toHaveAttribute('type', 'button');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveAttribute('data-state', 'on');
    const host = fixture.componentInstance as unknown as { bold: boolean; changed: () => void };
    expect(host.bold).toBe(true);
    expect(host.changed).toHaveBeenCalledWith(true);
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('works with reactive forms, including the disabled state', async () => {
    const control = new FormControl(true);
    const { fixture } = await render(`<button dsToggle [formControl]="control">Italic</button>`, {
      imports: [DsToggle, ReactiveFormsModule],
      componentProperties: { control },
    });
    const toggle = screen.getByRole('button', { name: 'Italic' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(toggle);
    expect(control.value).toBe(false);
    expect(control.dirty).toBe(true);
    control.setValue(true);
    await fixture.whenStable();
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    control.disable();
    await fixture.whenStable();
    expect(toggle).toBeDisabled();
  });
});

describe('DsToggleGroup', () => {
  it('single groups have one tab stop, arrow keys, and at most one pressed item', async () => {
    const onValueChange = vi.fn();
    const { container } = await render(
      `<div dsToggleGroup type="single" value="list" aria-label="View" (valueChange)="onValueChange($event)">
         <button dsToggleGroupItem value="list">List</button>
         <button dsToggleGroupItem value="board">Board</button>
         <button dsToggleGroupItem value="table" disabled>Table</button>
       </div>
       <button type="button">After</button>`,
      { imports: [...DsToggleGroupParts], componentProperties: { onValueChange } },
    );
    const list = screen.getByRole('button', { name: 'List' });
    const board = screen.getByRole('button', { name: 'Board' });
    expect(screen.getByRole('group', { name: 'View' })).toBeInTheDocument();
    await userEvent.tab();
    expect(list).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(board).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(list).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}{Enter}');
    expect(board).toHaveAttribute('aria-pressed', 'true');
    expect(list).toHaveAttribute('aria-pressed', 'false');
    expect(onValueChange).toHaveBeenLastCalledWith('board');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(board).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(board).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(list).toHaveFocus();
    await userEvent.click(board);
    expect(onValueChange).toHaveBeenLastCalledWith('');
    await expectNoA11yViolations(container);
  });

  it('vertical groups use the up and down arrows', async () => {
    await render(
      `<div dsToggleGroup orientation="vertical" aria-label="Align">
         <button dsToggleGroupItem value="top">Top</button>
         <button dsToggleGroupItem value="bottom">Bottom</button>
       </div>`,
      { imports: [...DsToggleGroupParts] },
    );
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('data-orientation', 'vertical');
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Top' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Bottom' })).toHaveFocus();
  });

  it('multiple groups press any number of items and work with ngModel', async () => {
    const { fixture } = await render(
      `<div dsToggleGroup type="multiple" aria-label="Format" [(ngModel)]="format">
         <button dsToggleGroupItem value="bold">Bold</button>
         <button dsToggleGroupItem value="italic">Italic</button>
       </div>`,
      {
        imports: [...DsToggleGroupParts, FormsModule],
        componentProperties: { format: ['italic'] },
      },
    );
    await fixture.whenStable();
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Bold' }));
    expect((fixture.componentInstance as unknown as { format: string[] }).format).toEqual([
      'italic',
      'bold',
    ]);
  });
});
