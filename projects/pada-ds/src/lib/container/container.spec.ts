import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { ContainerComponent } from './container';

describe('Container', () => {
  it('defaults to the xl width and renders on any element', async () => {
    const { fixture } = await render(
      `<ds-container data-testid="default">Text</ds-container>
       <main dsContainer size="md">Main</main>`,
      { imports: [ContainerComponent] },
    );
    expect(screen.getByTestId('default')).toHaveAttribute('data-size', 'xl');
    expect(screen.getByRole('main')).toHaveAttribute('data-size', 'md');
    await expectNoA11yViolations(fixture.nativeElement);
  });
});
