import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { SegmentControlComponent, SegmentOption } from './segment-control';

const views: SegmentOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week', disabled: true },
  { value: 'month', label: 'Month' },
  { value: 'grid', icon: 'area', ariaLabel: 'Grid' },
];

describe('SegmentControlComponent', () => {
  it('selects the first segment by default and has one tab stop', async () => {
    const { container } = await render(
      `<ds-segment-control [options]="views" aria-label="Range" />`,
      { imports: [SegmentControlComponent], componentProperties: { views } },
    );
    expect(screen.getByRole('tablist', { name: 'Range' })).toBeInTheDocument();
    const day = screen.getByRole('tab', { name: 'Day' });
    expect(day).toHaveAttribute('aria-selected', 'true');
    expect(day).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Month' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tab', { name: 'Week' })).toBeDisabled();
    expect(screen.getByRole('tab', { name: 'Grid' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('arrow keys, Home and End move and select, skipping disabled segments and wrapping', async () => {
    const { fixture } = await render(`<ds-segment-control [options]="views" [(value)]="view" />`, {
      imports: [SegmentControlComponent],
      componentProperties: { views, view: 'day' },
    });
    const host = fixture.componentInstance as unknown as { view: string };
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Month' })).toHaveFocus();
    expect(host.view).toBe('month');
    await userEvent.keyboard('{ArrowDown}{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Day' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(host.view).toBe('grid');
    await userEvent.keyboard('{Home}');
    expect(host.view).toBe('day');
    await userEvent.keyboard('{End}');
    expect(host.view).toBe('grid');
    await userEvent.click(screen.getByRole('tab', { name: 'Month' }));
    expect(host.view).toBe('month');
  });

  it('works with reactive forms and ngModel', async () => {
    const control = new FormControl('month');
    const { fixture } = await render(
      `<ds-segment-control aria-label="A" [options]="views" [formControl]="control" />
       <ds-segment-control aria-label="B" [options]="views" [(ngModel)]="b" />`,
      {
        imports: [SegmentControlComponent, ReactiveFormsModule, FormsModule],
        componentProperties: { views, control, b: 'grid' },
      },
    );
    await fixture.whenStable();
    const [a, b] = screen.getAllByRole('tablist');
    const tabs = (list: HTMLElement) => Array.from(list.querySelectorAll('[role="tab"]'));
    expect(tabs(a)[2]).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(tabs(a)[0]);
    expect(control.value).toBe('day');
    control.disable();
    await fixture.whenStable();
    expect(tabs(a)[0]).toBeDisabled();
    expect(tabs(b)[3]).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(tabs(b)[2]);
    expect((fixture.componentInstance as unknown as { b: string }).b).toBe('month');
  });
});
