import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { stepValue } from './time';
import { DsTimeFieldParts } from './time-field.directive';

const segments = (attrs = '') => `
  <div dsTimeField #time="dsTimeField" aria-label="Start time" ${attrs}>
    @for (part of time.layout(); track $index) {
      @if (part.type === 'literal') {
        <span aria-hidden="true">{{ part.text }}</span>
      } @else {
        <span [dsTimeSegment]="part.type"></span>
      }
    }
  </div>
`;

async function setup(attrs: string, props: Record<string, unknown> = {}) {
  const result = await render(segments(attrs), {
    imports: [...DsTimeFieldParts, ReactiveFormsModule],
    componentProperties: { value: null, ...props },
  });
  const value = () => (result.fixture.componentInstance as unknown as { value: string | null }).value;
  return { ...result, value };
}

const spin = (name: string) => screen.getByRole('spinbutton', { name });

describe('DsTimeField', () => {
  it('lays out spinbuttons in the locale order, 12-hour with AM/PM for en-US', async () => {
    const { fixture } = await setup('locale="en-US" [(value)]="value"', { value: '13:05' });
    expect(screen.getByRole('group', { name: 'Start time' })).toBeInTheDocument();
    const all = screen.getAllByRole('spinbutton');
    expect(all.map((segment) => segment.getAttribute('aria-label'))).toEqual([
      'Hours',
      'Minutes',
      'AM/PM',
    ]);
    expect(spin('Hours')).toHaveAttribute('aria-valuenow', '1');
    expect(spin('Hours')).toHaveAttribute('aria-valuemin', '1');
    expect(spin('Hours')).toHaveAttribute('aria-valuemax', '12');
    expect(spin('Minutes')).toHaveTextContent('05');
    expect(spin('AM/PM')).toHaveTextContent('PM');
    expect(spin('AM/PM')).toHaveAttribute('aria-valuetext', 'PM');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('is 24-hour for en-GB, with seconds when asked', async () => {
    await setup('locale="en-GB" granularity="second" [(value)]="value"', { value: '09:30:15' });
    const all = screen.getAllByRole('spinbutton');
    expect(all.map((segment) => segment.textContent)).toEqual(['09', '30', '15']);
    expect(spin('Hours')).toHaveAttribute('aria-valuemax', '23');
  });

  it('steps with the arrows (wrapping), PageUp/PageDown and Home/End', async () => {
    const { fixture, value } = await setup('locale="en-GB" minuteStep="5" [(value)]="value"', {
      value: '23:57',
    });
    spin('Hours').focus();
    await userEvent.keyboard('{ArrowUp}');
    await settle(fixture);
    expect(value()).toBe('00:57');
    await userEvent.keyboard('{PageUp}');
    await settle(fixture);
    expect(value()).toBe('02:57');
    await userEvent.keyboard('{End}');
    await settle(fixture);
    expect(value()).toBe('23:57');
    await userEvent.keyboard('{ArrowRight}');
    expect(spin('Minutes')).toHaveFocus();
    // Steps snap to the minute step.
    await userEvent.keyboard('{ArrowDown}');
    await settle(fixture);
    expect(value()).toBe('23:55');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    await settle(fixture);
    expect(value()).toBe('23:05');
    await userEvent.keyboard('{Home}');
    await settle(fixture);
    expect(value()).toBe('23:00');
    await userEvent.keyboard('{ArrowLeft}');
    expect(spin('Hours')).toHaveFocus();
  });

  it('types digits, moving on when a segment is full, and A/P for the period', async () => {
    const { fixture, value } = await setup('locale="en-US" [(value)]="value"');
    expect(spin('Hours')).toHaveAttribute('aria-valuetext', 'Empty');
    spin('Hours').focus();
    await userEvent.keyboard('9');
    await settle(fixture);
    // 9 cannot take a second digit on a 12-hour clock.
    expect(spin('Minutes')).toHaveFocus();
    await userEvent.keyboard('45');
    await settle(fixture);
    expect(spin('AM/PM')).toHaveFocus();
    // Still incomplete without AM/PM.
    expect(value()).toBeNull();
    await userEvent.keyboard('p');
    await settle(fixture);
    expect(value()).toBe('21:45');
    await userEvent.keyboard('a');
    await settle(fixture);
    expect(value()).toBe('09:45');

    spin('Hours').focus();
    await userEvent.keyboard('1');
    await settle(fixture);
    expect(spin('Hours')).toHaveFocus();
    await userEvent.keyboard('2');
    await settle(fixture);
    expect(value()).toBe('00:45');
  });

  it('Backspace empties a segment (the value becomes null), then moves back', async () => {
    const { fixture, value } = await setup('locale="en-GB" [(value)]="value"', { value: '08:15' });
    spin('Minutes').focus();
    await userEvent.keyboard('{Backspace}');
    await settle(fixture);
    expect(value()).toBeNull();
    expect(spin('Minutes')).toHaveTextContent('––');
    expect(spin('Minutes')).toHaveAttribute('data-placeholder');
    // The half-entered time stays while the value is null.
    expect(spin('Hours')).toHaveTextContent('08');
    await userEvent.keyboard('{Backspace}');
    expect(spin('Hours')).toHaveFocus();
    // "3" cannot start a two-digit hour: it fills Hours and "0" goes on to Minutes.
    await userEvent.keyboard('30');
    await settle(fixture);
    expect(value()).toBe('03:00');
  });

  it('marks out-of-range values invalid and works as a forms control', async () => {
    const control = new FormControl<string | null>('07:00');
    const { fixture } = await setup('locale="en-GB" min="08:00" max="18:00" [formControl]="control"', {
      control,
    });
    expect(spin('Hours')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('group')).toHaveAttribute('data-invalid');
    spin('Hours').focus();
    await userEvent.keyboard('{ArrowUp}');
    await settle(fixture);
    expect(control.value).toBe('08:00');
    expect(spin('Hours')).not.toHaveAttribute('aria-invalid');
    await userEvent.tab();
    await userEvent.tab();
    expect(control.touched).toBe(true);
    control.setValue(null);
    await settle(fixture);
    expect(spin('Hours')).toHaveTextContent('––');
    control.disable();
    await settle(fixture);
    expect(spin('Hours')).toHaveAttribute('aria-disabled', 'true');
    expect(spin('Hours')).not.toHaveAttribute('tabindex');
  });

  it('readOnly segments do not change', async () => {
    const { fixture, value } = await setup('locale="en-GB" readOnly [(value)]="value"', {
      value: '10:00',
    });
    spin('Hours').focus();
    await userEvent.keyboard('{ArrowUp}5');
    await settle(fixture);
    expect(value()).toBe('10:00');
    expect(spin('Hours')).toHaveAttribute('aria-readonly', 'true');
  });

  it('stepValue snaps and wraps', () => {
    expect(stepValue(7, 1, 5, 0, 59)).toBe(10);
    expect(stepValue(7, -1, 5, 0, 59)).toBe(5);
    expect(stepValue(55, 1, 5, 0, 59)).toBe(0);
    expect(stepValue(0, -1, 5, 0, 59)).toBe(55);
    expect(stepValue(null, -1, 1, 1, 12)).toBe(12);
    expect(stepValue(12, 1, 1, 1, 12)).toBe(1);
  });
});
