import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { AspectRatioComponent } from './aspect-ratio';

describe('AspectRatio', () => {
  it('sets the ratio token', async () => {
    const { fixture } = await render(
      `<ds-aspect-ratio data-testid="ratio" [ratio]="16 / 9"><img src="x.png" alt="Cover" /></ds-aspect-ratio>
       <ds-aspect-ratio data-testid="square" />`,
      { imports: [AspectRatioComponent] },
    );
    expect(screen.getByTestId('ratio').style.getPropertyValue('--pada-aspect-ratio')).toBe(
      String(16 / 9),
    );
    expect(screen.getByTestId('square').style.getPropertyValue('--pada-aspect-ratio')).toBe('1');
    await expectNoA11yViolations(fixture.nativeElement);
  });
});
