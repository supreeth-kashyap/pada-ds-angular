import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { RatingComponent } from './rating';

describe('RatingComponent', () => {
  it('is a radio group of stars that can be cleared', async () => {
    const onValueChange = vi.fn();
    const { container } = await render(
      `<ds-rating label="Your rating" [value]="2" (valueChange)="onValueChange($event)" />`,
      { imports: [RatingComponent], componentProperties: { onValueChange } },
    );
    expect(screen.getByRole('radiogroup', { name: 'Your rating' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '2 stars' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '1 star' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: '4 stars' }).closest('label')!);
    expect(onValueChange).toHaveBeenLastCalledWith(4);
    await userEvent.click(screen.getByRole('radio', { name: '4 stars' }).closest('label')!);
    expect(onValueChange).toHaveBeenLastCalledWith(0);
    expect(screen.getByRole('radio', { name: '4 stars' })).not.toBeChecked();
    await expectNoA11yViolations(container);
  });

  it('arrow keys change the rating; hovering previews', async () => {
    const { fixture, container } = await render(
      `<ds-rating label="Quality" [showLabel]="false" [(value)]="stars" />`,
      { imports: [RatingComponent], componentProperties: { stars: 3 } },
    );
    expect(screen.getByRole('radiogroup', { name: 'Quality' })).toBeInTheDocument();
    screen.getByRole('radio', { name: '3 stars' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect((fixture.componentInstance as unknown as { stars: number }).stars).toBe(4);
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect((fixture.componentInstance as unknown as { stars: number }).stars).toBe(2);
    const options = container.querySelectorAll('.rating-option');
    fireEvent.pointerEnter(options[4]);
    fixture.detectChanges();
    expect(container.querySelectorAll('.rating-option[data-filled]')).toHaveLength(5);
    fireEvent.pointerLeave(container.querySelector('.rating-stars')!);
    fixture.detectChanges();
    expect(container.querySelectorAll('.rating-option[data-filled]')).toHaveLength(2);
  });

  it('read-only ratings are one image with the value in words', async () => {
    const { container } = await render(`<ds-rating label="Average" [value]="4.5" readonly />`, {
      imports: [RatingComponent],
    });
    expect(screen.getByRole('img', { name: '4.5 out of 5 stars' })).toBeInTheDocument();
    expect(screen.queryByRole('radio')).toBeNull();
    const stars = container.querySelectorAll<SVGElement>('.rating-star');
    expect(stars[4].style.getPropertyValue('--pada-rating-fill')).toBe('50%');
    await expectNoA11yViolations(container);
  });

  it('works with reactive forms and ngModel', async () => {
    const control = new FormControl(1);
    const { fixture } = await render(
      `<ds-rating label="A" [formControl]="control" />
       <ds-rating label="B" [max]="3" [(ngModel)]="b" />`,
      {
        imports: [RatingComponent, ReactiveFormsModule, FormsModule],
        componentProperties: { control, b: 0 },
      },
    );
    await fixture.whenStable();
    const [a, b] = screen.getAllByRole('radiogroup');
    const radios = (group: HTMLElement) => Array.from(group.querySelectorAll('input'));
    expect(radios(a)[0]).toBeChecked();
    await userEvent.click(radios(a)[2].closest('label')!);
    await userEvent.tab();
    expect(control.value).toBe(3);
    expect(control.touched).toBe(true);
    control.disable();
    await fixture.whenStable();
    expect(radios(a)[0]).toBeDisabled();
    expect(radios(b)).toHaveLength(3);
    await userEvent.click(radios(b)[1].closest('label')!);
    expect((fixture.componentInstance as unknown as { b: number }).b).toBe(2);
  });
});
