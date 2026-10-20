import type { Meta, StoryObj } from '@storybook/angular';
import { BreadcrumbsComponent, type BreadcrumbItem } from 'pada-ds-angular';

const trail: BreadcrumbItem[] = [
  { label: 'Home', href: '#' },
  { label: 'Projects', href: '#' },
  { label: 'Pada', href: '#' },
  { label: 'Components', href: '#' },
  { label: 'Breadcrumbs', href: '#' },
  { label: 'Settings' },
];

const meta: Meta<BreadcrumbsComponent> = {
  title: 'Navigation/Breadcrumbs',
  component: BreadcrumbsComponent,
  args: { items: trail.slice(0, 3).concat(trail.slice(-1)), label: 'Breadcrumb' },
  render: (args) => ({
    props: { ...args, go: (e: { event: MouseEvent }) => e.event.preventDefault() },
    template: `<ds-breadcrumbs [items]="items" [maxItems]="maxItems" [label]="label" (navigate)="go($event)" />`,
  }),
};
export default meta;
type Story = StoryObj<BreadcrumbsComponent>;

export const Default: Story = {};
export const Collapsed: Story = { args: { items: trail, maxItems: 4 } };
export const SingleItem: Story = { args: { items: [{ label: 'Dashboard' }] } };
