import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { FilterOption } from './filter';
import { ToolbarParts } from './toolbar';

const OPTIONS: FilterOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited', disabled: true },
  { value: 'suspended', label: 'Suspended' },
];

async function setup(template: string, props: Record<string, unknown> = {}) {
  return render(template, {
    imports: [...ToolbarParts],
    componentProperties: { options: OPTIONS, onChange: vi.fn(), ...props },
  });
}

describe('Filter', () => {
  it('single select: arrow keys move through options, Enter picks one and closes', async () => {
    const { fixture } = await setup(
      `<ds-filter label="Status" [options]="options" (filterChange)="onChange($event)" />`,
    );
    const onChange = fixture.componentInstance.onChange as ReturnType<typeof vi.fn>;
    const chip = screen.getByRole('button', { name: /Status/ });
    expect(chip).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(chip);
    await settle(fixture);
    const listbox = screen.getByRole('listbox', { name: 'Status' });
    expect(screen.getByRole('dialog', { name: 'Status' })).toContainElement(listbox);
    expect(screen.getByRole('option', { name: 'Active' })).toHaveFocus();
    // One tab stop: the other options are out of the tab order.
    expect(screen.getByRole('option', { name: 'Suspended' })).toHaveAttribute('tabindex', '-1');
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Suspended' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(onChange).toHaveBeenCalledWith({ value: ['suspended'], options: [OPTIONS[2]] });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(chip).toHaveFocus();
    expect(chip).toHaveTextContent('1 selected');
    expect(chip).toHaveAttribute('data-active', '');
  });

  it('multi select: stages a draft, Apply commits it, Escape discards it', async () => {
    const { fixture } = await setup(
      `<ds-filter label="Status" [options]="options" multiSelect [(value)]="value" (filterChange)="onChange($event)" />`,
      { value: [] },
    );
    const onChange = fixture.componentInstance.onChange as ReturnType<typeof vi.fn>;
    await userEvent.click(screen.getByRole('button', { name: /Status/ }));
    await settle(fixture);
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
    await userEvent.click(screen.getByRole('option', { name: 'Active' }));
    await settle(fixture);
    expect(screen.getByRole('option', { name: 'Active' })).toHaveAttribute('aria-selected', 'true');
    await expectNoA11yViolations(fixture.nativeElement);
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /Status/ }));
    await settle(fixture);
    expect(screen.getByRole('option', { name: 'Active' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    await userEvent.click(screen.getByRole('option', { name: 'Suspended' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await settle(fixture);
    expect(onChange).toHaveBeenCalledWith({ value: ['suspended'], options: [OPTIONS[2]] });
    expect(fixture.componentInstance).toMatchObject({ value: ['suspended'] });
    expect(screen.queryByRole('dialog')).toBeNull();

    // Clear empties the draft; Apply commits the empty selection.
    await userEvent.click(screen.getByRole('button', { name: /Status/ }));
    await settle(fixture);
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await settle(fixture);
    expect(onChange).toHaveBeenLastCalledWith({ value: [], options: [] });
  });
});

describe('MoreFilter', () => {
  it('lists filters as vertical tabs with an option list each, and applies all at once', async () => {
    const filters = [
      { id: 'status', label: 'Status', options: OPTIONS },
      { id: 'year', label: 'Joined year', options: [{ value: '2024', label: '2024' }] },
    ];
    const { fixture } = await setup(
      `<ds-more-filter [filters]="filters" (filterChange)="onChange($event)" />`,
      { filters },
    );
    const onChange = fixture.componentInstance.onChange as ReturnType<typeof vi.fn>;
    const chip = screen.getByRole('button', { name: /More/ });
    await userEvent.click(chip);
    await settle(fixture);
    expect(screen.getByRole('dialog', { name: 'More filters' })).toBeInTheDocument();
    const status = screen.getByRole('tab', { name: 'Status' });
    expect(status).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    status.focus();
    await userEvent.keyboard('{ArrowDown}');
    await settle(fixture);
    expect(screen.getByRole('tab', { name: 'Joined year' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.click(screen.getByRole('option', { name: '2024' }));
    await settle(fixture);
    expect(screen.getByRole('tab', { name: /Joined year/ })).toHaveTextContent('1 selected');
    await expectNoA11yViolations(fixture.nativeElement);
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await settle(fixture);
    expect(onChange).toHaveBeenCalledWith({ value: { year: ['2024'] }, count: 1 });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(chip).toHaveTextContent('1 selected');
  });

  it('shows a filter on hover and discards staged picks on Escape', async () => {
    const filters = [
      { id: 'status', label: 'Status', options: OPTIONS, multiSelect: false },
      { id: 'year', label: 'Year', options: [{ value: '2024', label: '2024' }] },
    ];
    const { fixture } = await setup(
      `<ds-more-filter label="Extra" [filters]="filters" [(value)]="value" />`,
      { filters, value: { status: ['active'] } },
    );
    await userEvent.click(screen.getByRole('button', { name: /Extra/ }));
    await settle(fixture);
    expect(screen.getByRole('option', { name: 'Active' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('option', { name: 'Suspended' }));
    await settle(fixture);
    expect(screen.getByRole('option', { name: 'Active' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    await userEvent.hover(screen.getByRole('tab', { name: 'Year' }));
    await settle(fixture);
    expect(screen.getByRole('tab', { name: 'Year' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(fixture.componentInstance).toMatchObject({ value: { status: ['active'] } });
  });
});

describe('FilterChip', () => {
  it('has separate buttons to edit and to remove the filter', async () => {
    const onEdit = vi.fn();
    const onRemove = vi.fn();
    const { fixture } = await setup(
      `<ds-filter-chip label="Owner" value="Ada" (edit)="onEdit()" (remove)="onRemove()" />
       <ds-filter-chip variant="prompt" label="Team" value="Any" disabled />`,
      { onEdit, onRemove },
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove filter Owner: Ada' }));
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onEdit).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /^Owner\s*:\s*Ada$/ }));
    expect(onEdit).toHaveBeenCalledOnce();
    // Prompt chips have no remove button; disabled chips disable their buttons.
    expect(screen.queryByRole('button', { name: /Remove filter Team/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Team/ })).toBeDisabled();
    await expectNoA11yViolations(fixture.nativeElement);
  });
});

describe('Toolbar', () => {
  it('is one tab stop with arrow-key focus across filters, chips and actions', async () => {
    const onAction = vi.fn();
    const { fixture } = await setup(
      `<button type="button">Before</button>
       <ds-toolbar aria-label="Members" [actions]="[{ id: 'export', label: 'Export' }, { id: 'off', label: 'Archive', disabled: true }]"
                   [primaryAction]="{ id: 'invite', label: 'Invite' }" (action)="onAction($event)">
         <ds-filter label="Status" [options]="options" />
         <ds-filter-chip label="Owner" value="Ada" />
       </ds-toolbar>`,
      { onAction },
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Members' });
    expect(toolbar).toHaveAttribute('aria-orientation', 'horizontal');
    const status = within(toolbar).getByRole('button', { name: /Status/ });
    const remove = within(toolbar).getByRole('button', { name: 'Remove filter Owner: Ada' });
    const owner = within(toolbar).getByRole('button', { name: /^Owner\s*:\s*Ada$/ });
    const exportButton = within(toolbar).getByRole('button', { name: 'Export' });
    const invite = within(toolbar).getByRole('button', { name: 'Invite' });
    expect(status).toHaveAttribute('tabindex', '0');
    expect(remove).toHaveAttribute('tabindex', '-1');

    await userEvent.click(screen.getByRole('button', { name: 'Before' }));
    await userEvent.tab();
    expect(status).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(remove).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(exportButton).toHaveFocus();
    // The disabled action is skipped.
    await userEvent.keyboard('{ArrowRight}');
    expect(invite).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(status).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(invite).toHaveFocus();
    await userEvent.keyboard('{Home}{ArrowLeft}');
    expect(invite).toHaveFocus();
    await settle(fixture);
    expect(invite).toHaveAttribute('tabindex', '0');
    expect(status).toHaveAttribute('tabindex', '-1');
    // Tab leaves the toolbar, Shift+Tab comes back to the item focused last.
    await userEvent.tab();
    expect(toolbar).not.toContainElement(document.activeElement as HTMLElement);
    await userEvent.tab({ shift: true });
    expect(invite).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(exportButton).toHaveFocus();
    expect(owner).toHaveAttribute('tabindex', '-1');

    await userEvent.click(exportButton);
    expect(onAction).toHaveBeenCalledWith('export');
    await expectNoA11yViolations(fixture.nativeElement);
  });
});
