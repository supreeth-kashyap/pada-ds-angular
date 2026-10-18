import { TestBed } from '@angular/core/testing';
import { AvatarComponent, AvatarData } from './avatar';

function setup(data: AvatarData) {
  const fixture = TestBed.createComponent(AvatarComponent);
  fixture.componentRef.setInput('data', data);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('AvatarComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [AvatarComponent] }));

  it('renders image when src is provided', () => {
    const el = setup({ src: 'https://example.com/photo.jpg', alt: 'Jane Doe' });
    const img = el.querySelector('img.avatar__image') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toContain('photo.jpg');
    expect(img.alt).toBe('Jane Doe');
  });

  it('does not render initials or icon when src is provided', () => {
    const el = setup({ src: 'https://example.com/photo.jpg', alt: 'Jane Doe', initials: 'JD' });
    expect(el.querySelector('.avatar__initials')).toBeNull();
    expect(el.querySelector('.avatar__icon')).toBeNull();
  });

  it('renders initials when src is absent', () => {
    const el = setup({ initials: 'JD', alt: 'Jane Doe' });
    expect(el.querySelector('.avatar__initials')?.textContent?.trim()).toBe('JD');
  });

  it('exposes initials as an image named by alt', () => {
    const el = setup({ initials: 'JD', alt: 'Jane Doe' });
    const initials = el.querySelector('.avatar__initials');
    expect(initials?.getAttribute('role')).toBe('img');
    expect(initials?.getAttribute('aria-label')).toBe('Jane Doe');
  });

  it('renders user icon when neither src nor initials are provided', () => {
    const el = setup({ alt: 'Unknown user' });
    expect(el.querySelector('.avatar__icon')).not.toBeNull();
  });
});
