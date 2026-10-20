import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import {
  ButtonComponent,
  DropdownMenuParts,
  SplitButtonComponent,
  SplitButtonParts,
} from 'pada-ds-angular';

const meta: Meta<SplitButtonComponent> = {
  title: 'Actions/SplitButton',
  component: SplitButtonComponent,
  decorators: [
    moduleMetadata({ imports: [ButtonComponent, ...SplitButtonParts, ...DropdownMenuParts] }),
  ],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: { variant: 'primary', size: 'md', label: 'Save options' },
  render: (args) => ({
    props: args,
    template: `
      <ds-split-button [variant]="variant" [size]="size" [label]="label">
        <button dsButton>Save</button>
        <ds-dropdown-menu>
          <button dsButtonSplitter dsDropdownMenuTrigger></button>
          <ds-dropdown-menu-content align="end">
            <ds-dropdown-menu-item>Save as draft</ds-dropdown-menu-item>
            <ds-dropdown-menu-item>Save and publish</ds-dropdown-menu-item>
          </ds-dropdown-menu-content>
        </ds-dropdown-menu>
      </ds-split-button>`,
  }),
};
export default meta;
type Story = StoryObj<SplitButtonComponent>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Small: Story = { args: { size: 'sm' } };
