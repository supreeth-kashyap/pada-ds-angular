import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { BrandLogoComponent, provideBrandLogoUrl } from './brand-logo';

describe('BrandLogoComponent', () => {
  it('shows the named logo from the default library path', async () => {
    const { container } = await render(
      `<ds-brand-logo name="github" size="lg" background tooltip="Connected" />`,
      { imports: [BrandLogoComponent] },
    );
    const image = screen.getByRole('img', { name: 'github' });
    expect(image).toHaveAttribute('src', 'assets/logos/name=github.svg');
    const host = container.querySelector('ds-brand-logo')!;
    expect(host).toHaveAttribute('data-size', 'lg');
    expect(host).toHaveAttribute('data-background', '');
    expect(host.querySelector('.brand-logo-tooltip')).toHaveTextContent('Connected');
    await expectNoA11yViolations(container);
  });

  it('resolves URLs through provideBrandLogoUrl, and src wins', async () => {
    await render(
      `<ds-brand-logo name="slack" /><ds-brand-logo name="jira" src="/custom/jira.png" />`,
      {
        imports: [BrandLogoComponent],
        providers: [provideBrandLogoUrl((name) => `/static/${name}.svg`)],
      },
    );
    expect(screen.getByRole('img', { name: 'slack' })).toHaveAttribute('src', '/static/slack.svg');
    expect(screen.getByRole('img', { name: 'jira' })).toHaveAttribute('src', '/custom/jira.png');
    expect(screen.getByRole('img', { name: 'slack' }).parentElement).not.toHaveAttribute(
      'data-background',
    );
  });
});
