import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('creates the app', () => {
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });

  it('renders the placeholder heading and no library components', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Pada for Angular');
    expect(compiled.querySelector('p')).not.toBeNull();
    expect(compiled.querySelector('[class^="ds-"], [dsButton]')).toBeNull();
    expect(
      Array.from(compiled.querySelectorAll('*')).some((el) => el.tagName.startsWith('DS-')),
    ).toBe(false);
  });
});
