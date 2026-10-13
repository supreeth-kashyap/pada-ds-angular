import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render a heading for each showcased component', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const headings = Array.from(compiled.querySelectorAll('h1')).map((h) => h.textContent?.trim());
    expect(headings).toEqual(['Badge', 'Avatar', 'Button', 'Attributes']);
  });

  it('should render the showcased components', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const app = fixture.componentInstance;
    expect(compiled.querySelectorAll('.showcase > ds-badge').length).toBe(app.badges.length);
    expect(compiled.querySelectorAll('.showcase > ds-avatar').length).toBe(app.avatars.length);
    expect(compiled.querySelectorAll('.showcase > ds-button').length).toBe(app.buttons.length);
    expect(compiled.querySelector('ds-attributes')).not.toBeNull();
  });
});
