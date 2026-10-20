import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ToggleGroupComponent, ToggleGroupParts } from 'pada-ds-angular';

type ToggleGroupArgs = ToggleGroupComponent & { type: 'single' | 'multiple'; disabled: boolean };

const meta: Meta<ToggleGroupArgs> = {
  title: 'Actions/ToggleGroup',
  component: ToggleGroupComponent,
  decorators: [moduleMetadata({ imports: [...ToggleGroupParts] })],
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
  args: { size: 'md', disabled: false },
  render: (args) => ({
    props: { ...args, view: 'list' },
    template: `
      <ds-toggle-group type="single" [(value)]="view" [size]="size" [disabled]="disabled" aria-label="View">
        <button dsToggleGroupItem value="list" icon="menu_2">List</button>
        <button dsToggleGroupItem value="board" icon="area">Board</button>
        <button dsToggleGroupItem value="calendar" icon="calendar_3">Calendar</button>
      </ds-toggle-group>`,
  }),
};
export default meta;
type Story = StoryObj<ToggleGroupArgs>;

export const Single: Story = {};
export const Multiple: Story = {
  render: (args) => ({
    props: { ...args, marks: ['bold'] },
    template: `
      <ds-toggle-group type="multiple" [(value)]="marks" [size]="size" [disabled]="disabled" aria-label="Formatting">
        <button dsToggleGroupItem value="bold">Bold</button>
        <button dsToggleGroupItem value="italic">Italic</button>
        <button dsToggleGroupItem value="underline">Underline</button>
      </ds-toggle-group>`,
  }),
};
export const Small: Story = { args: { size: 'sm' } };
export const Disabled: Story = { args: { disabled: true } };
