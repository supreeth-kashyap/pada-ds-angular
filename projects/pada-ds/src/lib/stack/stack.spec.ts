import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { StackComponent } from './stack';

describe('Stack', () => {
  it('lays out a column with a token gap by default', async () => {
    const { fixture } = await render(`<ds-stack data-testid="stack"><span>A</span></ds-stack>`, {
      imports: [StackComponent],
    });
    const stack = screen.getByTestId('stack');
    expect(stack).toHaveAttribute('data-direction', 'column');
    expect(stack).not.toHaveAttribute('data-align');
    expect(stack).not.toHaveAttribute('data-wrap');
    expect(stack.style.getPropertyValue('--pada-stack-gap')).toBe('var(--pada-space-2)');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('sets direction, alignment, wrap and half-step gaps from inputs, on any element', async () => {
    await render(
      `<ul dsStack direction="row" gap="1.5" align="center" justify="between" wrap>
         <li>One</li>
       </ul>
       <ds-stack data-testid="none" [gap]="0" />`,
      { imports: [StackComponent] },
    );
    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('data-direction', 'row');
    expect(list).toHaveAttribute('data-align', 'center');
    expect(list).toHaveAttribute('data-justify', 'between');
    expect(list).toHaveAttribute('data-wrap', '');
    expect(list.style.getPropertyValue('--pada-stack-gap')).toBe('var(--pada-space-1-5)');
    expect(screen.getByTestId('none').style.getPropertyValue('--pada-stack-gap')).toBe('0px');
  });
});
