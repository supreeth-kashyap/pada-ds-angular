import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideTheme, ThemeService } from 'pada-ds-angular/headless';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { DialogParts } from '../dialog/dialog';
import { ThemeParts } from './theme';

/** Shows the page-wide theme, like the React test's useTheme() consumer. */
@Component({
  selector: 'ds-test-current',
  template: '<output>{{ theme.theme() }}/{{ theme.resolvedTheme() }}</output>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class CurrentThemeComponent {
  readonly theme = inject(ThemeService);
}

const root = () => document.documentElement;

describe('Theme', () => {
  afterEach(() => {
    root().removeAttribute('data-theme');
    root().style.removeProperty('--pada-accent-hue');
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('applies theme axes to a subtree', async () => {
    const { fixture } = await render(
      `<ds-theme-provider defaultTheme="dark" accent="amber" density="compact" radius="lg">
         <span>Inside</span>
       </ds-theme-provider>`,
      { imports: [...ThemeParts] },
    );
    const scope = screen.getByText('Inside').parentElement!;
    expect(scope).toHaveAttribute('data-theme', 'dark');
    expect(scope).toHaveAttribute('data-accent', 'amber');
    expect(scope).toHaveAttribute('data-density', 'compact');
    expect(scope).toHaveAttribute('data-radius', 'lg');
    expect(scope).not.toHaveAttribute('data-neutral');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('toggles light and dark on <html> and remembers the choice', async () => {
    const { fixture } = await render(`<button dsThemeToggle></button><ds-test-current />`, {
      imports: [...ThemeParts, CurrentThemeComponent],
      providers: [provideTheme({ defaultTheme: 'light', storageKey: 'pada-theme' })],
    });
    await settle(fixture);
    expect(root()).toHaveAttribute('data-theme', 'light');
    const toggle = screen.getByRole('button', { name: 'Switch to dark theme' });
    expect(toggle).toHaveAttribute('type', 'button');
    expect(toggle).toHaveAttribute('data-theme-current', 'light');
    await userEvent.click(toggle);
    await settle(fixture);
    expect(root()).toHaveAttribute('data-theme', 'dark');
    expect(screen.getByRole('status')).toHaveTextContent('dark/dark');
    expect(window.localStorage.getItem('pada-theme')).toBe('dark');
    expect(toggle).toHaveAccessibleName('Switch to light theme');
    expect(toggle).toHaveAttribute('data-theme-current', 'dark');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('starts from the stored theme', async () => {
    window.localStorage.setItem('pada-theme', 'dark');
    const { fixture } = await render(`<ds-test-current />`, {
      imports: [CurrentThemeComponent],
      providers: [provideTheme({ defaultTheme: 'light', storageKey: 'pada-theme' })],
    });
    await settle(fixture);
    expect(root()).toHaveAttribute('data-theme', 'dark');
  });

  it('sets the custom accent hue on the themed element, where the accent tokens read it', async () => {
    const { container } = await render(
      `<ds-theme-provider accent="custom" [accentHue]="140"><span>Inside</span></ds-theme-provider>`,
      { imports: [...ThemeParts] },
    );
    const scope = container.querySelector('ds-theme-provider') as HTMLElement;
    expect(scope).toHaveAttribute('data-accent', 'custom');
    expect(scope.style.getPropertyValue('--pada-accent-hue')).toBe('140');
  });

  it('sets the custom accent hue on <html> for the page-wide theme', async () => {
    const { fixture } = await render(`<ds-test-current />`, {
      imports: [CurrentThemeComponent],
      providers: [provideTheme({ accent: 'custom', accentHue: 20 })],
    });
    await settle(fixture);
    expect(root()).toHaveAttribute('data-accent', 'custom');
    expect(root().style.getPropertyValue('--pada-accent-hue')).toBe('20');
    TestBed.inject(ThemeService).accentHue.set(200);
    await settle(fixture);
    expect(root().style.getPropertyValue('--pada-accent-hue')).toBe('200');
  });

  it('restores <html> when the app goes away', async () => {
    root().setAttribute('data-theme', 'light');
    const { fixture } = await render(`<ds-test-current />`, {
      imports: [CurrentThemeComponent],
      providers: [provideTheme({ defaultTheme: 'dark', density: 'spacious' })],
    });
    await settle(fixture);
    expect(root()).toHaveAttribute('data-theme', 'dark');
    expect(root()).toHaveAttribute('data-density', 'spacious');
    TestBed.resetTestingModule();
    expect(root()).toHaveAttribute('data-theme', 'light');
    expect(root()).not.toHaveAttribute('data-density');
  });

  it('gives each toggle its own icon mask', async () => {
    const { container } = await render(
      `<ds-theme-provider defaultTheme="light">
         <button dsThemeToggle></button>
         <button dsThemeToggle size="sm"></button>
       </ds-theme-provider>`,
      { imports: [...ThemeParts] },
    );
    const ids = [...container.querySelectorAll('mask')].map((mask) => mask.id);
    expect(new Set(ids).size).toBe(2);
    container.querySelectorAll('.theme-toggle').forEach((toggle) => {
      expect(toggle.querySelector('.theme-toggle-disc')).toHaveAttribute(
        'mask',
        `url(#${toggle.querySelector('mask')!.id})`,
      );
    });
    expect(container.querySelectorAll('.theme-toggle')[1]).toHaveAttribute('data-size', 'sm');
  });

  it('system follows the OS and leaves data-theme unset', async () => {
    const { fixture } = await render(`<ds-test-current />`, {
      imports: [CurrentThemeComponent],
      providers: [provideTheme()],
    });
    await settle(fixture);
    expect(root()).not.toHaveAttribute('data-theme');
    expect(screen.getByRole('status')).toHaveTextContent('system/light');
  });

  it('resolves system to dark when the OS prefers it, and follows changes', async () => {
    const listeners: (() => void)[] = [];
    const query = {
      matches: true,
      addEventListener: (_: string, listener: () => void) => listeners.push(listener),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => query),
    );
    const { fixture } = await render(
      `<ds-theme-provider><button dsThemeToggle></button></ds-theme-provider>`,
      { imports: [...ThemeParts] },
    );
    await settle(fixture);
    expect(screen.getByRole('button')).toHaveAccessibleName('Switch to light theme');
    query.matches = false;
    listeners.forEach((listener) => listener());
    await settle(fixture);
    expect(screen.getByRole('button')).toHaveAccessibleName('Switch to dark theme');
  });

  it('a toggle inside a scope switches the scope, not the page', async () => {
    const themeChange = vi.fn();
    const { fixture, container } = await render(
      `<ds-theme-provider defaultTheme="light" (themeChange)="themeChange($event)">
         <button dsThemeToggle></button>
       </ds-theme-provider>`,
      { imports: [...ThemeParts], componentProperties: { themeChange } },
    );
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    await settle(fixture);
    expect(container.querySelector('ds-theme-provider')).toHaveAttribute('data-theme', 'dark');
    expect(root()).not.toHaveAttribute('data-theme');
    expect(themeChange).toHaveBeenCalledWith('dark');
  });

  it('a controlled scope only changes when the theme comes back', async () => {
    const { fixture, container } = await render(
      `<ds-theme-provider [theme]="theme"><button dsThemeToggle></button></ds-theme-provider>`,
      { imports: [...ThemeParts], componentProperties: { theme: 'light' } },
    );
    await userEvent.click(screen.getByRole('button'));
    await settle(fixture);
    expect(container.querySelector('ds-theme-provider')).toHaveAttribute('data-theme', 'light');
  });

  it('keeps overlays opened in a subtree in that subtree, so they keep its theme', async () => {
    const { fixture } = await render(
      `<ds-theme-provider defaultTheme="dark">
         <ds-dialog>
           <button dsDialogTrigger>Open</button>
           <ds-dialog-content><ds-dialog-title>Scoped</ds-dialog-title></ds-dialog-content>
         </ds-dialog>
       </ds-theme-provider>`,
      { imports: [...ThemeParts, ...DialogParts] },
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await settle(fixture);
    const dialog = screen.getByRole('dialog', { name: 'Scoped' });
    expect(dialog.closest('[data-theme]')).toHaveAttribute('data-theme', 'dark');
  });
});
