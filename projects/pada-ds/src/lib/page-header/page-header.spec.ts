import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { BreadcrumbItem } from '../breadcrumbs/breadcrumbs';
import { PageHeaderParts } from './page-header';

const trail: BreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
  { label: 'Pada', href: '/projects/pada' },
  { label: 'Members' },
];

describe('PageHeader', () => {
  it('shows a short trail in full, ending in the current page, and the actions', async () => {
    const commandClick = vi.fn();
    const aiClick = vi.fn();
    const { fixture } = await render(
      `<ds-page-header [breadcrumbs]="trail" (commandClick)="commandClick()" (aiClick)="aiClick()" />`,
      {
        imports: [...PageHeaderParts],
        componentProperties: { trail: trail.slice(1), commandClick, aiClick },
      },
    );
    await settle(fixture);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Members')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('button', { name: 'Show hidden breadcrumbs' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /Search/ }));
    expect(commandClick).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'AI' }));
    expect(aiClick).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument();
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('collapses a long trail to its ends and lists the rest on request', async () => {
    const navigate = vi.fn((event: { event: Event }) => event.event.preventDefault());
    const { fixture } = await render(
      `<ds-page-header [breadcrumbs]="trail" (navigate)="navigate($event)" />`,
      { imports: [...PageHeaderParts], componentProperties: { trail, navigate } },
    );
    await settle(fixture);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Projects' })).toBeNull();
    expect(screen.getByText('Members')).toHaveAttribute('aria-current', 'page');

    const more = screen.getByRole('button', { name: 'Show hidden breadcrumbs' });
    await userEvent.click(more);
    await settle(fixture);
    const list = screen.getByRole('dialog', { name: 'Hidden breadcrumbs' });
    expect(list).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Projects' }));
    expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ item: trail[1] }));
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(more).toHaveFocus();
  });

  it('opens the profile menu from a custom trigger', async () => {
    const { fixture } = await render(
      `<ds-page-header [breadcrumbs]="trail" profileLabel="Profile">
         <span dsPageHeaderProfileTrigger>SK</span>
         <div dsPageHeaderProfileMenu><a href="/logout">Log out</a></div>
       </ds-page-header>`,
      { imports: [...PageHeaderParts], componentProperties: { trail } },
    );
    await settle(fixture);
    const trigger = screen.getByRole('button', { name: 'Profile' });
    expect(trigger).toHaveTextContent('SK');
    expect(trigger.querySelector('ds-icon')).toBeNull();
    await userEvent.click(trigger);
    await settle(fixture);
    expect(screen.getByRole('dialog', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log out' })).toHaveFocus();
    await expectNoA11yViolations(fixture.nativeElement);
  });
});
