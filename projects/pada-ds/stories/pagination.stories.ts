import type { Meta, StoryObj } from '@storybook/angular';
import { PaginationComponent } from 'pada-ds-angular';

const meta: Meta<PaginationComponent> = {
  title: 'Navigation/Pagination',
  component: PaginationComponent,
  args: { page: 1, totalPages: 10, siblingCount: 1, boundaryCount: 1 },
  render: (args) => ({
    props: args,
    template: `<ds-pagination [(page)]="page" [totalPages]="totalPages" [siblingCount]="siblingCount" [boundaryCount]="boundaryCount" />`,
  }),
};
export default meta;
type Story = StoryObj<PaginationComponent>;

export const Default: Story = {};
export const Middle: Story = { args: { page: 10, totalPages: 20 } };
export const LastPage: Story = { args: { page: 20, totalPages: 20 } };
export const FewPages: Story = { args: { page: 2, totalPages: 3 } };
export const WideSiblings: Story = { args: { page: 25, totalPages: 50, siblingCount: 2 } };
