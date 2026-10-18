import { render } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { KbdComponent } from './kbd';

describe('KbdComponent', () => {
  it('renders one key per entry', async () => {
    const { container } = await render(`<kbd dsKbd [keys]="['⌘', 'K']"></kbd>`, {
      imports: [KbdComponent],
    });
    const keys = container.querySelectorAll('kbd kbd');
    expect(keys).toHaveLength(2);
    expect(keys[0]).toHaveTextContent('⌘');
    expect(keys[1]).toHaveTextContent('K');
    expect(container.querySelector('kbd[dsKbd]')).toHaveAttribute('data-group', '');
    await expectNoA11yViolations(container);
  });

  it('renders a single key from its content', async () => {
    const { container } = await render(`<p>Press <kbd dsKbd>Esc</kbd></p>`, {
      imports: [KbdComponent],
    });
    const key = container.querySelector('kbd')!;
    expect(key).toHaveTextContent('Esc');
    expect(key).not.toHaveAttribute('data-group');
    expect(key.querySelector('kbd')).toBeNull();
  });
});
