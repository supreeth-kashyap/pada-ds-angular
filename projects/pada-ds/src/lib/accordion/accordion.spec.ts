import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { AccordionParts } from './accordion';

describe('Accordion (styled)', () => {
  it('composes a group from parts', async () => {
    const { fixture } = await render(
      `<ds-accordion type="single" collapsible>
         <ds-accordion-item value="a">
           <ds-accordion-trigger iconName="download_2">Install</ds-accordion-trigger>
           <ds-accordion-content>npm install pada-ds</ds-accordion-content>
         </ds-accordion-item>
         <ds-accordion-item value="b">
           <ds-accordion-trigger [headingLevel]="2">Use</ds-accordion-trigger>
           <ds-accordion-content>Import a component</ds-accordion-content>
         </ds-accordion-item>
       </ds-accordion>`,
      { imports: [...AccordionParts] },
    );
    const install = screen.getByRole('button', { name: 'Install' });
    expect(install).toHaveClass('accordion-header');
    expect(install.closest('h3')).toHaveClass('accordion-heading');
    expect(screen.getByRole('heading', { level: 2 })).toContainElement(
      screen.getByRole('button', { name: 'Use' }),
    );
    await userEvent.click(install);
    await settle(fixture);
    const region = screen.getByRole('region', { name: 'Install' });
    expect(region.tagName).toBe('DS-ACCORDION-CONTENT');
    expect(region).toHaveAttribute('data-state', 'open');
    expect(region).toHaveTextContent('npm install pada-ds');
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Use' })).toHaveFocus();
    await expectNoA11yViolations(fixture.nativeElement);
    await userEvent.click(install);
    await settle(fixture);
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('keeps the 1.x API: header, icon, heading level, two-way open state', async () => {
    const onOpenChange = vi.fn();
    const { fixture, rerender } = await render(
      `<ds-accordion-section header="What is Pada?" headerIconName="help_outline"
         [headingLevel]="level" [(open)]="open" (openChange)="onOpenChange($event)">
         Body
       </ds-accordion-section>`,
      {
        imports: [...AccordionParts],
        componentProperties: { open: false, level: 3, onOpenChange },
      },
    );
    const trigger = screen.getByRole('button', { name: 'What is Pada?' });
    expect(trigger.closest('h3')).toHaveClass('accordion-heading');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await settle(fixture);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('region', { name: 'What is Pada?' })).toHaveTextContent('Body');

    await rerender({ componentProperties: { open: true, level: 2, onOpenChange } });
    await settle(fixture);
    expect(screen.getByRole('heading', { level: 2 })).toContainElement(
      screen.getByRole('button', { name: 'What is Pada?' }),
    );
    await expectNoA11yViolations(fixture.nativeElement);
  });
});
