import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { TreeComponent, TreeParts, toTreeData, type TreeApiNode } from 'pada-ds-angular';

/** A `GET /files` response: nested nodes with numeric ids and nullable fields. */
const filesResponse: TreeApiNode[] = [
  {
    id: 1,
    name: 'src',
    icon: 'folder',
    children: [
      {
        id: 2,
        name: 'app',
        icon: 'folder',
        children: [
          { id: 3, name: 'app.component.ts', icon: 'document' },
          { id: 4, name: 'app.routes.ts', icon: 'document' },
        ],
      },
      { id: 5, name: 'main.ts', icon: 'document' },
      { id: 6, name: 'styles.css', icon: 'document', children: null },
    ],
  },
  { id: 7, name: 'docs', icon: 'folder', children: [{ id: 8, name: 'README.md', icon: 'notes' }] },
  { id: 9, name: 'secrets.env', icon: 'lock', disabled: true },
  { id: 10, name: null, icon: null },
];
const sizes: Record<string, string> = { '3': '4 KB', '4': '1 KB', '5': '2 KB', '6': '12 KB', '8': '6 KB' };

type TreeArgs = TreeComponent & {
  expanded: string[];
  value: string[];
  selectionMode: 'single' | 'multiple' | 'none';
};

const meta: Meta<TreeArgs> = {
  title: 'Data/Tree',
  component: TreeComponent,
  decorators: [moduleMetadata({ imports: [...TreeParts] })],
  argTypes: { selectionMode: { control: 'select', options: ['single', 'multiple', 'none'] } },
  args: { data: toTreeData(filesResponse), expanded: ['1', '2'], value: ['3'], selectionMode: 'single' },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 320px">
        <ds-tree aria-label="Project" [data]="data" [selectionMode]="selectionMode" [(expanded)]="expanded" [(value)]="value" />
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<TreeArgs>;

export const Default: Story = {};
export const Collapsed: Story = { args: { expanded: [], value: [] } };
export const MultipleSelection: Story = {
  args: { selectionMode: 'multiple', value: ['3', '5'], expanded: ['1', '2', '7'] },
};
export const NoSelection: Story = { args: { selectionMode: 'none', value: [] } };
export const CustomContent: Story = {
  render: (args) => ({
    props: { ...args, sizes },
    template: `
      <div style="max-width: 320px">
        <ds-tree aria-label="Files" [data]="data" [(expanded)]="expanded">
          <ng-template dsTreeItemContent let-item>
            {{ item.label }} @if (sizes[item.value]) { <small style="opacity: 0.6">{{ sizes[item.value] }}</small> }
          </ng-template>
        </ds-tree>
      </div>`,
  }),
};
