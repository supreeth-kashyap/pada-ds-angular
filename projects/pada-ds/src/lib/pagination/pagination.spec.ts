import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { PaginationComponent, paginationRange } from './pagination';

describe('paginationRange', () => {
  it('shows every page when there is room', () => {
    expect(paginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginationRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('collapses gaps into ellipses around the current page', () => {
    expect(paginationRange(1, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 20]);
    expect(paginationRange(10, 20)).toEqual([1, 'ellipsis-start', 9, 10, 11, 'ellipsis-end', 20]);
    expect(paginationRange(20, 20)).toEqual([1, 'ellipsis-start', 16, 17, 18, 19, 20]);
  });

  it('never hides a single page behind an ellipsis', () => {
    expect(paginationRange(4, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 20]);
    expect(paginationRange(17, 20)).toEqual([1, 'ellipsis-start', 16, 17, 18, 19, 20]);
  });
});

describe('Pagination', () => {
  it('marks the current page and moves with previous and next', async () => {
    const onPageChange = vi.fn();
    const { fixture } = await render(
      `<ds-pagination [page]="1" totalPages="10" (pageChange)="onPageChange($event)" />`,
      { imports: [PaginationComponent], componentProperties: { onPageChange } },
    );
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await expectNoA11yViolations(fixture.nativeElement);
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    await userEvent.click(screen.getByRole('button', { name: 'Page 10' }));
    expect(onPageChange).toHaveBeenLastCalledWith(10);
  });

  it('two-way binds the page and disables next on the last page', async () => {
    const { fixture } = await render(
      `<ds-pagination [(page)]="page" totalPages="20" label="Results pages" />`,
      { imports: [PaginationComponent], componentProperties: { page: 10 } },
    );
    expect(screen.getByRole('navigation', { name: 'Results pages' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Page 5' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Page 20' }));
    await settle(fixture);
    expect((fixture.componentInstance as unknown as { page: number }).page).toBe(20);
    expect(screen.getByRole('button', { name: 'Page 20' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Page 16' })).toBeInTheDocument();
  });
});
