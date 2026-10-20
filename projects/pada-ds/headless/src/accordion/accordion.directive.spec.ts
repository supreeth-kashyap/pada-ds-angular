import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { DsCollapsibleParts } from '../collapsible/collapsible.directive';
import { DsAccordionParts } from './accordion.directive';

const TEMPLATE = `
  <div dsAccordion [type]="type" [collapsible]="collapsible" [(value)]="value"
       (valueChange)="onValueChange($event)">
    @for (label of labels; track label) {
      <div dsAccordionItem [value]="label.toLowerCase()" [disabled]="label === 'Returns'">
        <h3 dsAccordionHeader><button dsAccordionTrigger>{{ label }}</button></h3>
        <div dsAccordionContent #content="dsAccordionContent">
          @if (content.present()) { {{ label }} details }
        </div>
      </div>
    }
  </div>
`;

async function setup(props: { type?: string; collapsible?: boolean; value?: unknown } = {}) {
  const onValueChange = vi.fn();
  const result = await render(TEMPLATE, {
    imports: [...DsAccordionParts],
    componentProperties: {
      type: 'single',
      collapsible: false,
      value: undefined,
      labels: ['Shipping', 'Returns', 'Warranty'],
      onValueChange,
      ...props,
    },
  });
  const click = async (element: HTMLElement) => {
    await userEvent.click(element);
    await settle(result.fixture);
  };
  const button = (name: string) => screen.getByRole('button', { name });
  return { ...result, onValueChange, click, button };
}

describe('DsAccordion', () => {
  it('wires each trigger to a labelled region inside a heading', async () => {
    const { button, fixture } = await setup({ value: 'shipping' });
    const trigger = button('Shipping');
    expect(trigger.closest('h3')).not.toBeNull();
    expect(trigger.closest('h3')).toHaveAttribute('data-state', 'open');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const region = screen.getByRole('region', { name: 'Shipping' });
    expect(trigger).toHaveAttribute('aria-controls', region.id);
    expect(region).toHaveTextContent('Shipping details');
    // Closed content stays in the DOM (hidden, empty) so aria-controls always resolves.
    const closed = document.getElementById(button('Warranty').getAttribute('aria-controls')!);
    expect(closed).toHaveAttribute('hidden');
    expect(closed).toBeEmptyDOMElement();
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('single: opening one closes the other; the open one stays open unless collapsible', async () => {
    const { button, click, onValueChange } = await setup({ value: 'shipping' });
    const shipping = button('Shipping');
    expect(shipping).toHaveAttribute('aria-disabled', 'true');
    await click(shipping);
    expect(shipping).toHaveAttribute('aria-expanded', 'true');
    await click(button('Warranty'));
    expect(onValueChange).toHaveBeenLastCalledWith('warranty');
    expect(shipping).toHaveAttribute('aria-expanded', 'false');
    expect(shipping).not.toHaveAttribute('aria-disabled');
  });

  it('single and collapsible: the open item closes again', async () => {
    const { button, click, onValueChange } = await setup({ collapsible: true, value: 'shipping' });
    const shipping = button('Shipping');
    expect(shipping).not.toHaveAttribute('aria-disabled');
    await click(shipping);
    expect(shipping).toHaveAttribute('aria-expanded', 'false');
    expect(onValueChange).toHaveBeenLastCalledWith('');
  });

  it('multiple: items open independently', async () => {
    const { button, click, onValueChange } = await setup({ type: 'multiple' });
    await click(button('Shipping'));
    await click(button('Warranty'));
    expect(onValueChange).toHaveBeenLastCalledWith(['shipping', 'warranty']);
    expect(screen.getAllByRole('region')).toHaveLength(2);
    await click(button('Shipping'));
    expect(onValueChange).toHaveBeenLastCalledWith(['warranty']);
  });

  it('arrow keys, Home and End move between enabled triggers and wrap', async () => {
    const { button } = await setup({ type: 'multiple' });
    const shipping = button('Shipping');
    const warranty = button('Warranty');
    expect(button('Returns')).toBeDisabled();
    shipping.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(warranty).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(shipping).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(warranty).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(shipping).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(warranty).toHaveFocus();
  });
});

describe('DsCollapsible', () => {
  it('toggles its content and reports the state', async () => {
    const onOpenChange = vi.fn();
    const { fixture } = await render(
      `<div dsCollapsible (openChange)="onOpenChange($event)">
         <button dsCollapsibleTrigger>Details</button>
         <div dsCollapsibleContent #content="dsCollapsibleContent">
           @if (content.present()) { Hidden text }
         </div>
       </div>`,
      { imports: [...DsCollapsibleParts], componentProperties: { onOpenChange } },
    );
    const trigger = screen.getByRole('button', { name: 'Details' });
    expect(trigger).toHaveAttribute('type', 'button');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Hidden text')).toBeNull();
    await userEvent.click(trigger);
    await settle(fixture);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(trigger).toHaveAttribute('data-state', 'open');
    expect(screen.getByText('Hidden text')).toBeVisible();
    await userEvent.click(trigger);
    await settle(fixture);
    expect(screen.queryByText('Hidden text')).toBeNull();
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toHaveAttribute(
      'hidden',
    );
  });

  it('does not toggle while disabled', async () => {
    const { fixture } = await render(
      `<div dsCollapsible disabled>
         <button dsCollapsibleTrigger>Details</button>
         <div dsCollapsibleContent>Text</div>
       </div>`,
      { imports: [...DsCollapsibleParts] },
    );
    const trigger = screen.getByRole('button', { name: 'Details' });
    expect(trigger).toBeDisabled();
    trigger.click();
    await settle(fixture);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
