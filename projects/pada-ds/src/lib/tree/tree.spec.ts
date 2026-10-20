import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { TreeData, TreeParts } from './tree';
import { toTreeData } from './tree.adapter';

const DATA: TreeData = {
  items: [
    {
      value: 'src',
      label: 'src',
      icon: 'folder',
      children: [
        { value: 'index', label: 'index.ts' },
        { value: 'theme', label: 'theme.css' },
      ],
    },
    { value: 'readme', label: 'README.md' },
  ],
};

describe('TreeComponent', () => {
  it('renders nested items from data and selects them', async () => {
    const onValue = vi.fn();
    const { fixture } = await render(
      `<ds-tree aria-label="Project" [data]="data" (valueChange)="onValue($event)" />`,
      { imports: [...TreeParts], componentProperties: { data: DATA, onValue } },
    );
    const src = screen.getByRole('treeitem', { name: 'src' });
    expect(screen.getByRole('tree', { name: 'Project' })).toBeInTheDocument();
    expect(src.firstElementChild).toHaveClass('tree-row');
    expect(src).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('treeitem', { name: 'theme.css' })).toBeNull();
    await userEvent.click(src.querySelector('.tree-indicator')!);
    await settle(fixture);
    expect(screen.getByRole('treeitem', { name: 'theme.css' })).toHaveAttribute('aria-level', '2');
    expect(screen.getByRole('group')).toHaveStyle({ '--pada-tree-level': '0' });
    await userEvent.click(screen.getByText('theme.css'));
    await settle(fixture);
    expect(onValue).toHaveBeenCalledWith(['theme']);
    expect(screen.getByRole('treeitem', { name: 'theme.css' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('two-way binds expanded and moves with the keyboard', async () => {
    const { fixture } = await render(
      `<ds-tree aria-label="Project" [data]="data" [(expanded)]="expanded" />`,
      { imports: [...TreeParts], componentProperties: { data: DATA, expanded: [] as string[] } },
    );
    screen.getByRole('treeitem', { name: 'src' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await settle(fixture);
    expect((fixture.componentInstance as unknown as { expanded: string[] }).expanded).toEqual([
      'src',
    ]);
    await userEvent.keyboard('{ArrowRight}');
    await settle(fixture);
    expect(screen.getByRole('treeitem', { name: 'index.ts' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await settle(fixture);
    expect(screen.getByRole('treeitem', { name: 'README.md' })).toHaveFocus();
  });

  it('renders custom label content', async () => {
    await render(
      `<ds-tree aria-label="Project" [data]="data">
         <ng-template dsTreeItemContent let-item>{{ item.label }} ({{ item.value }})</ng-template>
       </ds-tree>`,
      { imports: [...TreeParts], componentProperties: { data: DATA } },
    );
    expect(screen.getByRole('treeitem', { name: 'README.md (readme)' })).toBeInTheDocument();
  });
});

describe('toTreeData', () => {
  it('normalises ids, names and empty children', () => {
    expect(
      toTreeData([
        { id: 1, name: ' Docs ', children: [{ id: 2, name: null, disabled: true }] },
        { id: 'x', children: [] },
      ]),
    ).toEqual({
      items: [
        { value: '1', label: 'Docs', children: [{ value: '2', label: '2', disabled: true }] },
        { value: 'x', label: 'x' },
      ],
    });
    expect(toTreeData(null)).toEqual({ items: [] });
  });
});
