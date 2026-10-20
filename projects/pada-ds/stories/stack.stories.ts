import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ButtonComponent, StackComponent } from 'pada-ds-angular';

const box = 'padding: 12px 16px; border-radius: 8px; background: var(--pada-color-surface-raised); border: 1px solid var(--pada-color-border)';

const meta: Meta<StackComponent> = {
  title: 'Layout/Stack',
  component: StackComponent,
  decorators: [moduleMetadata({ imports: [ButtonComponent] })],
  argTypes: {
    direction: { control: 'select', options: ['row', 'column'] },
    gap: { control: 'select', options: [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16] },
    align: { control: 'select', options: [undefined, 'start', 'center', 'end', 'stretch', 'baseline'] },
    justify: { control: 'select', options: [undefined, 'start', 'center', 'end', 'between', 'around'] },
  },
  args: { direction: 'column', gap: 2, wrap: false },
  render: (args) => ({
    props: { ...args, box },
    template: `
      <ds-stack [direction]="direction" [gap]="gap" [align]="align" [justify]="justify" [wrap]="wrap">
        <div [style]="box">One</div>
        <div [style]="box">Two</div>
        <div [style]="box">Three</div>
      </ds-stack>`,
  }),
};
export default meta;
type Story = StoryObj<StackComponent>;

export const Default: Story = {};
export const Row: Story = { args: { direction: 'row', gap: 3, align: 'center' } };
export const SpaceBetween: Story = { args: { direction: 'row', justify: 'between' } };
export const Actions: Story = {
  render: () => ({
    template: `
      <ds-stack direction="row" gap="3" align="center">
        <button dsButton>Save</button>
        <button dsButton variant="ghost">Cancel</button>
      </ds-stack>`,
  }),
};
export const OnAnElement: Story = {
  render: () => ({
    template: `
      <ul dsStack gap="1" style="margin: 0; padding-left: 20px">
        <li>Install the package</li>
        <li>Import the styles</li>
        <li>Use a component</li>
      </ul>`,
  }),
};
