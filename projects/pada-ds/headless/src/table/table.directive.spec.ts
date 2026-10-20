import { fireEvent, render, screen, within } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { DsTableParts, TableColumn } from './table.directive';

const COLUMNS: TableColumn[] = [
  { id: 'name', label: 'Name', width: 200 },
  { id: 'role', label: 'Role' },
];

describe('DsTable (headless)', () => {
  it('lays rows out on the columns, and resizes through the handle', async () => {
    const { fixture } = await render(
      `<div dsTable dsTableGrid [(columns)]="columns" aria-label="Users">
         <div dsTableRow>
           @for (column of columns; track column.id) {
             <div dsTableColumnHeader [columnId]="column.id" [sortDirection]="column.id === 'name' ? 'descending' : undefined">
               {{ column.label }}
               <span dsTableResizeHandle [attr.aria-label]="'Resize ' + column.label"></span>
             </div>
           }
         </div>
         <div dsTableRow [selected]="true"><div dsTableCell rowHeader>Ada</div><div dsTableCell [span]="1">Owner</div></div>
       </div>`,
      { imports: [...DsTableParts], componentProperties: { columns: COLUMNS } },
    );
    const table = screen.getByRole('table', { name: 'Users' });
    const [header, body] = within(table).getAllByRole('row');
    expect(header).toHaveStyle({ gridTemplateColumns: '200px minmax(0, 1fr)' });
    expect(body).toHaveAttribute('aria-selected', 'true');
    expect(within(body).getByRole('cell')).toHaveStyle({ gridColumn: 'span 1' });
    expect(screen.getAllByRole('columnheader')[0]).toHaveAttribute('aria-sort', 'descending');
    const handle = screen.getByRole('separator', { name: 'Resize Name' });
    expect(handle).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    await settle(fixture);
    expect(handle).toHaveAttribute('aria-valuenow', '184');
    expect(header).toHaveStyle({ gridTemplateColumns: '184px minmax(0, 1fr)' });
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('resizes by dragging the handle', async () => {
    const { fixture } = await render(
      `<div dsTable dsTableGrid [columns]="columns" aria-label="Users">
         <div dsTableRow><div dsTableColumnHeader columnId="name">Name<span dsTableResizeHandle aria-label="Resize"></span></div></div>
       </div>`,
      { imports: [...DsTableParts], componentProperties: { columns: COLUMNS } },
    );
    const handle = screen.getByRole('separator');
    fireEvent.pointerDown(handle, { button: 0, clientX: 100 });
    fireEvent.pointerMove(window, { clientX: 150 });
    fireEvent.pointerUp(window);
    fireEvent.pointerMove(window, { clientX: 400 });
    await settle(fixture);
    expect(handle).toHaveAttribute('aria-valuenow', '250');
  });
});
