import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { AvatarComponent, AvatarGroupComponent, avatarInitials } from './avatar';

// jsdom never loads images; drive the load events by hand.
interface FakeImage {
  onload?: () => void;
  onerror?: () => void;
  src?: string;
}
const images: FakeImage[] = [];
const RealImage = globalThis.Image;

beforeEach(() => {
  images.length = 0;
  globalThis.Image = class {
    onload?: () => void;
    onerror?: () => void;
    src?: string;
    constructor() {
      images.push(this);
    }
  } as unknown as typeof Image;
});
afterEach(() => {
  globalThis.Image = RealImage;
});

describe('AvatarComponent', () => {
  it('shows initials with a stable colour until the image loads', async () => {
    const { fixture, container } = await render(
      `<ds-avatar name="Ada Lovelace" src="/ada.png" size="lg" />`,
      { imports: [AvatarComponent] },
    );
    const fallback = screen.getByRole('img', { name: 'Ada Lovelace' });
    expect(fallback).toHaveTextContent('AL');
    expect(fallback).toHaveAttribute('data-color');
    expect(fallback).toHaveAttribute('data-size', 'lg');
    expect(images[0].src).toBe('/ada.png');

    images[0].onload?.();
    await settle(fixture);
    const image = screen.getByRole('img', { name: 'Ada Lovelace' });
    expect(image.tagName).toBe('IMG');
    expect(image).toHaveAttribute('src', '/ada.png');
    await expectNoA11yViolations(container);
  });

  it('gives the same name the same colour', async () => {
    await render(
      `<ds-avatar data-testid="a" name="Grace Hopper" /><ds-avatar data-testid="b" name="Grace Hopper" />`,
      { imports: [AvatarComponent] },
    );
    expect(screen.getByTestId('a').getAttribute('data-color')).toBe(
      screen.getByTestId('b').getAttribute('data-color'),
    );
  });

  it('keeps the fallback when the image fails, and uses an icon without a name', async () => {
    const { fixture } = await render(
      `<ds-avatar name="Grace Hopper" src="/broken.png" /><ds-avatar alt="Unknown user" />`,
      { imports: [AvatarComponent] },
    );
    images[0].onerror?.();
    await settle(fixture);
    expect(screen.getByRole('img', { name: 'Grace Hopper' })).toHaveTextContent('GH');
    expect(screen.getByRole('img', { name: 'Unknown user' }).querySelector('svg')).not.toBeNull();
  });

  it('lets initials override the derived ones, and shows a named status dot', async () => {
    const { container } = await render(
      `<ds-avatar name="Pada Design System" initials="P" shape="square" status="online" />`,
      { imports: [AvatarComponent] },
    );
    const avatar = screen.getByRole('img', { name: 'Pada Design System' });
    expect(avatar).toHaveTextContent('P');
    expect(avatar).toHaveAttribute('data-shape', 'square');
    expect(screen.getByRole('img', { name: 'online' })).toHaveAttribute('data-status', 'online');
    await expectNoA11yViolations(container);
  });

  it('derives up to two initials from the first and last word', () => {
    expect(avatarInitials('ada')).toBe('A');
    expect(avatarInitials('  Ada  King Lovelace ')).toBe('AL');
    expect(avatarInitials('')).toBe('');
  });
});

describe('AvatarGroupComponent', () => {
  it('groups avatars with an overflow count', async () => {
    const { container } = await render(
      `<ds-avatar-group label="Members" [max]="2" size="sm">
         <ds-avatar name="Ada Lovelace" size="lg" />
         <ds-avatar name="Grace Hopper" />
         <ds-avatar name="Alan Turing" />
         <ds-avatar name="Edsger Dijkstra" />
       </ds-avatar-group>`,
      { imports: [AvatarComponent, AvatarGroupComponent] },
    );
    const group = screen.getByRole('group', { name: 'Members' });
    expect(group.querySelectorAll('ds-avatar:not([hidden])')).toHaveLength(2);
    expect(screen.getByRole('img', { name: '2 more' })).toHaveTextContent('+2');
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveAttribute('data-size', 'sm');
    expect(screen.queryByRole('img', { name: 'Alan Turing' })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('shows every avatar without a max', async () => {
    await render(
      `<ds-avatar-group label="Team"><ds-avatar name="A B" /><ds-avatar name="C D" /></ds-avatar-group>`,
      { imports: [AvatarComponent, AvatarGroupComponent] },
    );
    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.getAllByRole('img')[0]).toHaveAttribute('data-grouped', '');
  });
});
