import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { ButtonComponent } from '../button/button';
import { BannerComponent } from './banner';

describe('BannerComponent', () => {
  it('renders title, subtitle and a projected action', async () => {
    const invite = vi.fn();
    const { container } = await render(
      `<ds-banner title="Invite your team" subtitle="Better together." visualIcon="team">
         <button dsButton variant="secondary" (click)="invite()">Invite</button>
       </ds-banner>`,
      { imports: [BannerComponent, ButtonComponent], componentProperties: { invite } },
    );
    expect(container.querySelector('.banner-title')).toHaveTextContent('Invite your team');
    expect(container.querySelector('.banner-subtitle')).toHaveTextContent('Better together.');
    expect(container.querySelector('.banner-visual ds-icon')).not.toBeNull();
    expect(container.querySelector('ds-banner')).not.toHaveAttribute('title');
    await userEvent.click(screen.getByRole('button', { name: 'Invite' }));
    expect(invite).toHaveBeenCalledTimes(1);
    await expectNoA11yViolations(container);
  });

  it('prefers an image visual, decorative by default', async () => {
    const { container } = await render(
      `<ds-banner title="News" visualIcon="bell" visualImage="/news.png" />`,
      { imports: [BannerComponent] },
    );
    const image = container.querySelector('.banner-visual img')!;
    expect(image).toHaveAttribute('src', '/news.png');
    expect(image).toHaveAttribute('alt', '');
    expect(container.querySelector('ds-icon')).toBeNull();
  });

  it('omits the visual and subtitle when not given', async () => {
    const { container } = await render(`<ds-banner title="Plain" />`, {
      imports: [BannerComponent],
    });
    expect(container.querySelector('.banner-visual')).toBeNull();
    expect(container.querySelector('.banner-subtitle')).toBeNull();
  });
});
