import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ResizableComponent, ResizableParts } from 'pada-ds-angular';

type ResizableArgs = ResizableComponent & { orientation: 'horizontal' | 'vertical'; disabled: boolean };

const pane = 'height: 100%; padding: 16px; box-sizing: border-box';

const meta: Meta<ResizableArgs> = {
  title: 'Layout/Resizable',
  component: ResizableComponent,
  decorators: [moduleMetadata({ imports: [...ResizableParts] })],
  argTypes: { orientation: { control: 'select', options: ['horizontal', 'vertical'] } },
  args: { orientation: 'horizontal', disabled: false },
  render: (args) => ({
    props: { ...args, pane },
    template: `
      <div style="height: 320px; border: 1px solid var(--pada-color-border); border-radius: 8px; overflow: hidden">
        <ds-resizable [orientation]="orientation" [disabled]="disabled">
          <ds-resizable-panel [defaultSize]="25" [minSize]="15" collapsible><div [style]="pane">Files</div></ds-resizable-panel>
          <ds-resizable-handle withGrip aria-label="Resize file list" />
          <ds-resizable-panel><div [style]="pane">Editor</div></ds-resizable-panel>
        </ds-resizable>
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<ResizableArgs>;

export const Default: Story = {};
export const Vertical: Story = { args: { orientation: 'vertical' } };
export const Disabled: Story = { args: { disabled: true } };
export const ThreePanels: Story = {
  render: () => ({
    props: { pane },
    template: `
      <div style="height: 320px; border: 1px solid var(--pada-color-border); border-radius: 8px; overflow: hidden">
        <ds-resizable>
          <ds-resizable-panel [defaultSize]="20" [minSize]="10"><div [style]="pane">Navigation</div></ds-resizable-panel>
          <ds-resizable-handle aria-label="Resize navigation" />
          <ds-resizable-panel [defaultSize]="55"><div [style]="pane">Document</div></ds-resizable-panel>
          <ds-resizable-handle aria-label="Resize inspector" />
          <ds-resizable-panel [defaultSize]="25" [minSize]="15" [maxSize]="40"><div [style]="pane">Inspector</div></ds-resizable-panel>
        </ds-resizable>
      </div>`,
  }),
};
