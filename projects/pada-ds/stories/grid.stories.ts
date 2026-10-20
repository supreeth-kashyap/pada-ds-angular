import type { Meta, StoryObj } from '@storybook/angular';
import { GridComponent } from 'pada-ds-angular';

const box = 'padding: 16px; border-radius: 8px; background: var(--pada-color-surface-raised); border: 1px solid var(--pada-color-border)';

const meta: Meta<GridComponent> = {
  title: 'Layout/Grid',
  component: GridComponent,
  argTypes: {
    gap: { control: 'select', options: [0, 1, 2, 3, 4, 6, 8] },
    align: { control: 'select', options: [undefined, 'start', 'center', 'end', 'stretch'] },
  },
  args: { columns: 3, gap: 4 },
  render: (args) => ({
    props: { ...args, box, cells: [1, 2, 3, 4, 5, 6] },
    template: `
      <ds-grid [columns]="columns" [minItemWidth]="minItemWidth" [gap]="gap" [rowGap]="rowGap" [align]="align">
        @for (cell of cells; track cell) { <div [style]="box">Cell {{ cell }}</div> }
      </ds-grid>`,
  }),
};
export default meta;
type Story = StoryObj<GridComponent>;

export const Default: Story = {};
export const TwoColumns: Story = { args: { columns: 2, gap: 2 } };
export const AutoFit: Story = { args: { minItemWidth: '12rem' } };
export const RowGap: Story = { args: { columns: 3, gap: 2, rowGap: 8 } };
