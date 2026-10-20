import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { FieldParts } from '../field/field';
import { SwitchComponent } from './switch';

describe('SwitchComponent', () => {
  it('is a labelled switch that toggles and two-way binds checked', async () => {
    const { fixture, container } = await render(`<ds-switch label="Wi-Fi" [(checked)]="on" />`, {
      imports: [SwitchComponent],
      componentProperties: { on: false },
    });
    const control = screen.getByRole('switch', { name: 'Wi-Fi' });
    expect(control).not.toBeChecked();
    await userEvent.click(screen.getByText('Wi-Fi'));
    expect(control).toBeChecked();
    expect((fixture.componentInstance as unknown as { on: boolean }).on).toBe(true);
    await userEvent.keyboard(' ');
    expect(control).not.toBeChecked();
    await expectNoA11yViolations(container);
  });

  it('loading shows a spinner, blocks interaction and announces busy', async () => {
    const { container } = await render(`<ds-switch label="Sync" [checked]="true" loading />`, {
      imports: [SwitchComponent],
    });
    const control = screen.getByRole('switch', { name: 'Sync' });
    expect(control).toBeChecked();
    expect(control).toBeDisabled();
    expect(control).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('.switch-spinner')).not.toBeNull();
    expect(container.querySelector('.switch-wrapper')).toHaveAttribute('data-loading');
    await userEvent.click(control);
    expect(control).toBeChecked();
  });

  it('works with reactive forms and ngModel', async () => {
    const control = new FormControl(true);
    const { fixture } = await render(
      `<ds-switch label="A" [formControl]="control" />
       <ds-switch label="B" [(ngModel)]="b" />`,
      {
        imports: [SwitchComponent, ReactiveFormsModule, FormsModule],
        componentProperties: { control, b: false },
      },
    );
    await fixture.whenStable();
    const a = screen.getByRole('switch', { name: 'A' });
    expect(a).toBeChecked();
    await userEvent.click(a);
    await userEvent.tab();
    expect(control.value).toBe(false);
    expect(control.touched).toBe(true);
    control.disable();
    await fixture.whenStable();
    expect(a).toBeDisabled();
    await userEvent.click(screen.getByRole('switch', { name: 'B' }));
    expect((fixture.componentInstance as unknown as { b: boolean }).b).toBe(true);
  });

  it('inside a ds-field, is described by the field', async () => {
    await render(
      `<ds-field>
         <ds-field-label>Alerts</ds-field-label>
         <ds-switch label="Push alerts" />
         <ds-field-description>Sent to your phone.</ds-field-description>
       </ds-field>`,
      { imports: [SwitchComponent, ...FieldParts] },
    );
    expect(screen.getByRole('switch', { name: /Push alerts/ })).toHaveAccessibleDescription(
      'Sent to your phone.',
    );
  });
});
