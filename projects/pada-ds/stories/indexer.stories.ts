import type { Meta, StoryObj } from '@storybook/angular';
import { IndexerComponent, type IndexerItem } from 'pada-ds-angular';

const sections: IndexerItem[] = [
  { id: 'idx-install', label: 'Install' },
  { id: 'idx-usage', label: 'Usage' },
  { id: 'idx-theming', label: 'Theming' },
  { id: 'idx-accessibility', label: 'Accessibility' },
];

const meta: Meta<IndexerComponent> = {
  title: 'Navigation/Indexer',
  component: IndexerComponent,
  args: { items: sections, activeIndex: 0, label: 'On this page' },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: grid; grid-template-columns: 1fr 200px; gap: 32px">
        <article>
          @for (s of items; track s.id) {
            <section [id]="s.id" style="min-height: 60vh">
              <h2 style="margin: 0 0 8px">{{ s.label }}</h2>
              <p>Scroll the page: the entry for the section nearest the top becomes active.</p>
            </section>
          }
        </article>
        <div style="position: sticky; top: 16px; align-self: start">
          <ds-indexer [items]="items" [(activeIndex)]="activeIndex" [label]="label" />
        </div>
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<IndexerComponent>;

export const Default: Story = {};
export const ThirdActive: Story = { args: { activeIndex: 2 } };
