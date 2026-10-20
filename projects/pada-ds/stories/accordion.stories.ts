import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { AccordionComponent, AccordionParts } from 'pada-ds-angular';

type AccordionArgs = AccordionComponent & {
  type: 'single' | 'multiple';
  collapsible: boolean;
  disabled: boolean;
};

const items = `
  <ds-accordion-item value="install">
    <ds-accordion-trigger iconName="download_2">Install</ds-accordion-trigger>
    <ds-accordion-content>npm install pada-ds-angular</ds-accordion-content>
  </ds-accordion-item>
  <ds-accordion-item value="use">
    <ds-accordion-trigger>Use</ds-accordion-trigger>
    <ds-accordion-content>Import a component and add it to your template.</ds-accordion-content>
  </ds-accordion-item>
  <ds-accordion-item value="theme">
    <ds-accordion-trigger>Theme</ds-accordion-trigger>
    <ds-accordion-content>Set the accent, density and radius with provideTheme().</ds-accordion-content>
  </ds-accordion-item>`;

const meta: Meta<AccordionArgs> = {
  title: 'Display/Accordion',
  component: AccordionComponent,
  decorators: [moduleMetadata({ imports: [...AccordionParts] })],
  args: { collapsible: true, disabled: false },
  render: (args) => ({
    props: { ...args, open: 'install' },
    template: `<ds-accordion type="single" [collapsible]="collapsible" [disabled]="disabled" [(value)]="open">${items}</ds-accordion>`,
  }),
};
export default meta;
type Story = StoryObj<AccordionArgs>;

export const Single: Story = {};
export const Multiple: Story = {
  render: (args) => ({
    props: { ...args, open: ['install', 'use'] },
    template: `<ds-accordion type="multiple" [disabled]="disabled" [(value)]="open">${items}</ds-accordion>`,
  }),
};
export const Disabled: Story = { args: { disabled: true } };
export const Section: Story = {
  render: () => ({
    props: { faq: false },
    template: `
      <ds-accordion-section header="What is Pada?" headerIconName="help" [(open)]="faq">
        A design system with React and Angular twins built from the same tokens.
      </ds-accordion-section>`,
  }),
};
