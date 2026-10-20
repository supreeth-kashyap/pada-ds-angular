import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { BreadcrumbItem, BreadcrumbsComponent } from './breadcrumbs';

const items: BreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
  { label: 'Pada', href: '/projects/pada' },
  { label: 'Settings', href: '/projects/pada/settings' },
  { label: 'Members' },
];

describe('Breadcrumbs', () => {
  it('is a labelled navigation list ending in the current page', async () => {
    const { fixture } = await render(`<ds-breadcrumbs [items]="items" />`, {
      imports: [BreadcrumbsComponent],
      componentProperties: { items },
    });
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(screen.getByText('Members')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('collapses the middle and expands on request, moving focus to the first revealed link', async () => {
    const { fixture } = await render(`<ds-breadcrumbs [items]="items" maxItems="3" />`, {
      imports: [BreadcrumbsComponent],
      componentProperties: { items },
    });
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.queryByRole('link', { name: 'Projects' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    await expectNoA11yViolations(fixture.nativeElement);
    await userEvent.click(screen.getByRole('button', { name: 'Show all breadcrumbs' }));
    await settle(fixture);
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveFocus();
  });

  it('reports link clicks, so the app can route on the client', async () => {
    const navigate = vi.fn((event: { event: MouseEvent }) => event.event.preventDefault());
    await render(
      `<ds-breadcrumbs [items]="items" label="Location" (navigate)="navigate($event)" />`,
      { imports: [BreadcrumbsComponent], componentProperties: { items, navigate } },
    );
    expect(screen.getByRole('navigation', { name: 'Location' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Pada' }));
    expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ item: items[2] }));
  });

  it('renders links through a custom template', async () => {
    await render(
      `<ds-breadcrumbs [items]="items" [linkTemplate]="link" />
       <ng-template #link let-item let-className="className">
         <a [class]="className" [attr.href]="'#' + item.href" data-custom>{{ item.label }}</a>
       </ng-template>`,
      { imports: [BreadcrumbsComponent], componentProperties: { items } },
    );
    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('data-custom');
    expect(link).toHaveClass('breadcrumbs-link');
    expect(link).toHaveAttribute('href', '#/');
  });
});
