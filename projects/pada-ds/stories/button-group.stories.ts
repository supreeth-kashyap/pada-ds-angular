import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ButtonComponent, ButtonGroupComponent } from 'pada-ds-angular';

const meta: Meta<ButtonGroupComponent> = {
  title: 'Actions/ButtonGroup',
  component: ButtonGroupComponent,
  decorators: [moduleMetadata({ imports: [ButtonComponent] })],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'destructive'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
  },
  args: {
    label: 'Text alignment',
    variant: 'secondary',
    size: 'sm',
    orientation: 'horizontal',
    attached: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <ds-button-group [label]="label" [variant]="variant" [size]="size" [orientation]="orientation" [attached]="attached">
        <button dsButton>Left</button>
        <button dsButton>Center</button>
        <button dsButton>Right</button>
      </ds-button-group>`,
  }),
};
export default meta;
type Story = StoryObj<ButtonGroupComponent>;

export const Default: Story = {};
export const Attached: Story = { args: { attached: true } };
export const Vertical: Story = { args: { orientation: 'vertical' } };
