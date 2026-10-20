import { Component, input } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { DsTreeParts } from './tree.directive';

interface Node {
  value: string;
  children?: Node[];
  disabled?: boolean;
}

const NODES: Node[] = [
  {
    value: 'src',
    children: [{ value: 'components', children: [{ value: 'Button.tsx' }] }, { value: 'index.ts' }],
  },
  { value: 'docs', children: [{ value: 'guide.md' }] },
  { value: 'package.json', disabled: true },
];

// Nested items are rendered by a recursive component, as a consumer would.
@Component({
  selector: 'ds-test-node',
  imports: [DsTreeParts],
  template: `
    <li
      dsTreeItem
      #item="dsTreeItem"
      [value]="node().value"
      [expandable]="!!node().children"
      [disabled]="!!node().disabled"
    >
      <div dsTreeItemRow>
        <span dsTreeItemIndicator [attr.data-testid]="'toggle-' + node().value">▸</span>
        <span dsTreeItemLabel>{{ node().value }}</span>
      </div>
      @if (node().children; as children) {
        <ul dsTreeGroup>
          @for (child of children; track child.value) {
            <ds-test-node [node]="child" />
          }
        </ul>
      }
    </li>
  `,
  host: { role: 'none' },
})
class TestNode {
  readonly node = input.required<Node>();
}

async function setup(props: Record<string, unknown> = {}) {
  const onValue = vi.fn();
  const result = await render(
    `<ul dsTree aria-label="Files" [selectionMode]="mode" [(expanded)]="expanded" [(value)]="value" (valueChange)="onValue($event)">
       @for (node of nodes; track node.value) { <ds-test-node [node]="node" /> }
     </ul>`,
    {
      imports: [...DsTreeParts, TestNode],
      componentProperties: {
        nodes: NODES,
        mode: 'single',
        expanded: [],
        value: [],
        onValue,
        ...props,
      },
    },
  );
  return { ...result, onValue };
}

const item = (name: string) => screen.getByRole('treeitem', { name });

describe('DsTree', () => {
  it('exposes tree semantics with levels, expanded and selected state, and one tab stop', async () => {
    const { fixture } = await setup({ expanded: ['src'], value: ['index.ts'] });
    expect(screen.getByRole('tree', { name: 'Files' })).toBeInTheDocument();
    expect(item('src')).toHaveAttribute('aria-expanded', 'true');
    expect(item('docs')).toHaveAttribute('aria-expanded', 'false');
    expect(item('index.ts')).toHaveAttribute('aria-level', '2');
    expect(item('index.ts')).toHaveAttribute('aria-selected', 'true');
    expect(item('index.ts')).toHaveAttribute('tabindex', '0');
    expect(item('package.json')).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getAllByRole('treeitem').filter((element) => element.tabIndex === 0),
    ).toHaveLength(1);
    expect(screen.queryByRole('treeitem', { name: 'guide.md' })).toBeNull();
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('navigates with arrows: Right expands then enters, Left collapses then goes up', async () => {
    const { fixture } = await setup();
    expect(item('src')).toHaveAttribute('tabindex', '0');
    item('src').focus();
    const press = async (keys: string) => {
      await userEvent.keyboard(keys);
      await settle(fixture);
    };
    await press('{ArrowRight}');
    expect(item('src')).toHaveAttribute('aria-expanded', 'true');
    await press('{ArrowRight}');
    expect(item('components')).toHaveFocus();
    expect(item('components')).toHaveAttribute('tabindex', '0');
    await press('{ArrowDown}{ArrowDown}');
    expect(item('docs')).toHaveFocus();
    await press('{ArrowUp}');
    await press('{ArrowLeft}');
    expect(item('src')).toHaveFocus();
    await press('{ArrowLeft}');
    expect(item('src')).toHaveAttribute('aria-expanded', 'false');
    await press('{End}');
    expect(item('package.json')).toHaveFocus();
    await press('{Home}');
    expect(item('src')).toHaveFocus();
    await press('*');
    expect(item('src')).toHaveAttribute('aria-expanded', 'true');
    expect(item('docs')).toHaveAttribute('aria-expanded', 'true');
    // Type-ahead
    await press('g');
    expect(item('guide.md')).toHaveFocus();
  });

  it('selects with Enter and click; multiple mode toggles; disabled items are not selected', async () => {
    const { fixture, onValue } = await setup({ mode: 'multiple', expanded: ['src'] });
    expect(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true');
    await userEvent.click(screen.getByText('index.ts'));
    await settle(fixture);
    expect(onValue).toHaveBeenLastCalledWith(['index.ts']);
    expect(item('index.ts')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp} ');
    await settle(fixture);
    expect(onValue).toHaveBeenLastCalledWith(['index.ts', 'components']);
    await userEvent.keyboard('{Enter}');
    expect(onValue).toHaveBeenLastCalledWith(['index.ts']);
    await userEvent.click(screen.getByText('package.json'));
    expect(onValue).toHaveBeenCalledTimes(3);
    // The indicator toggles without selecting.
    await userEvent.click(screen.getByTestId('toggle-docs'));
    await settle(fixture);
    expect(item('docs')).toHaveAttribute('aria-expanded', 'true');
    expect(onValue).toHaveBeenCalledTimes(3);
  });

  it('selection mode none: Enter and click toggle instead of selecting', async () => {
    const { fixture, onValue } = await setup({ mode: 'none' });
    expect(item('src')).not.toHaveAttribute('aria-selected');
    await userEvent.click(screen.getByText('docs'));
    await settle(fixture);
    expect(item('docs')).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(item('docs')).toHaveAttribute('aria-expanded', 'false');
    expect(onValue).not.toHaveBeenCalled();
  });
});
