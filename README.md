<p align="center">
  <img src="https://raw.githubusercontent.com/supreeth-kashyap/pada/main/src/assets/pada-ds-cover-image.png" alt="Pada . design: unified design system for web" width="640">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/pada-ds-angular"><img src="https://img.shields.io/npm/v/pada-ds-angular?color=4f46e5&label=npm" alt="npm version"></a>
  <a href="https://github.com/supreeth-kashyap/pada-ds-angular/releases"><img src="https://img.shields.io/github/v/release/supreeth-kashyap/pada-ds-angular?color=f59e0b&label=release" alt="Latest release"></a>
  <a href="https://main--6ad73b69f7d2adf27e282417.chromatic.com"><img src="https://img.shields.io/badge/storybook-React%20%2B%20Angular-ff4785" alt="Storybook"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/pada-ds-angular?color=78716c" alt="MIT licence"></a>
</p>

# Pada for Angular

[React](https://github.com/supreeth-kashyap/pada) · **Angular**

## What is Pada

Pada (पाद, Sanskrit for *foot*: the part that carries the weight) is a unified design system for the web. One design language ships as two first-class packages, one for React and one for Angular, with the same components, parts, keyboard behaviour, tokens and motion. Both are released together under the same version number.

- **Accessible by default.** Every interactive component follows its WAI-ARIA Authoring Practices pattern and is tested for keyboard behaviour and with axe.
- **Styled or headless.** Use the styled components, or take the headless layer (behaviour, focus, ARIA and state attributes, no styles) and bring your own look.
- **One token system.** Colour, type, space, radius, motion and elevation are `--pada-*` CSS custom properties. Light and dark, accent, density, radius and contrast are attributes you can set on any element.
- **Built for design and code.** The [Figma library](https://www.figma.com/community/file/1619638623779328209) is free in the Figma Community, and [pada.design](https://supreeth-kashyap.notion.site/Pada-Design-System-2c6a6474ca5a80cea166ed78587299a2) covers the principles.

## Packages

| | Package | Repository | Storybook |
|---|---|---|---|
| React | [`pada-ds`](https://www.npmjs.com/package/pada-ds) | [supreeth-kashyap/pada](https://github.com/supreeth-kashyap/pada) | [React + Angular](https://main--6ad73b69f7d2adf27e282417.chromatic.com) |
| Angular | [`pada-ds-angular`](https://www.npmjs.com/package/pada-ds-angular) | [supreeth-kashyap/pada-ds-angular](https://github.com/supreeth-kashyap/pada-ds-angular) | [Angular](https://main--6ad72a0038bb5d0de784c60f.chromatic.com) |

## Installation

```bash
npm install pada-ds-angular
```

Peer dependencies: Angular 21 and the CDK (`@angular/core`, `@angular/common`, `@angular/forms`, `@angular/cdk` `^21.2.0`). The tokens use `light-dark()`, `color-mix()` and relative colours, so they need a 2024-era browser (Chrome 123, Safari 18, Firefox 128 or later).

## Quick start

```scss
// styles.scss
@import 'pada-ds-angular/styles.css'; // tokens (light and dark) and component styles
@import 'pada-ds-angular/base.css';   // optional: body background, colour and font
```

```ts
import { Component, signal } from '@angular/core';
import { ButtonComponent, DialogParts } from 'pada-ds-angular';

@Component({
  selector: 'app-profile',
  imports: [ButtonComponent, ...DialogParts],
  template: `
    <ds-dialog [(open)]="editing">
      <button dsButton variant="primary" dsDialogTrigger>Edit profile</button>
      <ds-dialog-content size="sm">
        <ds-dialog-header>
          <ds-dialog-title>Edit profile</ds-dialog-title>
        </ds-dialog-header>
        <ds-dialog-body>…</ds-dialog-body>
      </ds-dialog-content>
    </ds-dialog>
  `,
})
export class Profile {
  editing = signal(false);
}
```

Components are standalone and OnPush, with signal inputs, `model()` two-way bindings (`[(open)]`, `[(value)]`) and `output()` events. Form controls implement `ControlValueAccessor`, so they work with reactive and template-driven forms.

## Headless

`pada-ds-angular/headless` ships the behaviour behind every component (state, keyboard handling, focus, ARIA and positioning) as directives with no styles. Every part exposes its state as `data-state`, `data-side`, `data-disabled` and `aria-*` attributes for you to style.

```html
<!-- imports: [DsDialogParts, DsPresence] from 'pada-ds-angular/headless' -->
<ng-container dsDialog [(open)]="open">
  <button dsDialogTrigger class="my-button">Edit profile</button>
  <dialog *dsPresence="open()" dsDialogContent class="my-dialog">
    <h2 dsDialogTitle>Edit profile</h2>
    <p dsDialogDescription>Changes save automatically.</p>
    <button dsDialogClose>Done</button>
  </dialog>
</ng-container>
```

## Theming

With no attribute the theme follows the operating system. Each axis is an attribute that works on `<html>` or on any container, so one section of a page can look different from the rest:

```html
<html data-theme="dark" data-accent="amber" data-density="compact">
  …
  <section data-theme="light">Always light</section>
</html>
```

| Attribute | Values |
|---|---|
| `data-theme` | `light`, `dark` (none follows the OS) |
| `data-accent` | `indigo` (default), `violet`, `amber`, `emerald`, `rose`, `sky`, … or `custom` with `--pada-accent-hue` |
| `data-neutral` | `stone` (default), `slate`, `gray`, `zinc`, `neutral` |
| `data-density` | `compact`, `comfortable`, `spacious` |
| `data-radius` | `none`, `sm`, `md`, `lg`, `xl` |
| `data-motion` | `reduced`, `full` |
| `data-contrast` | `standard`, `more` |

`ds-theme-provider` sets the same attributes on a subtree, and `button[dsThemeToggle]` switches light and dark. Tokens are also available as SCSS (`tokens.scss`).

## Components

More than 90 components, the same in both packages. The [Storybook](https://main--6ad73b69f7d2adf27e282417.chromatic.com) has every one with its props and examples, and the [parity matrix](https://github.com/supreeth-kashyap/pada-ds-angular/blob/main/docs/roadmap/parity.md) maps each React component to its Angular counterpart.

| Group | Components |
|---|---|
| Actions | Button, ButtonGroup, SplitButton, IconButton, Link, Toggle, ToggleGroup, Toolbar, DropdownMenu, ContextMenu, Menubar, CommandPalette |
| Forms | Field, InputText, InputTextArea, NumberInput, PasswordInput, PinInput, SearchField, Select, ComboBox, Autocomplete, TagInput, Checkbox, CheckboxGroup, RadioGroup, RadioCardGroup, Switch, Slider, RangeSlider, Rating, SegmentControl, Pills, ColorPicker, UploadField |
| Dates and time | Calendar, DatePicker, DateRangePicker, InputDate, TimePicker |
| Overlays | Dialog, AlertDialog, Drawer, Sheet, Popover, HoverCard, Tooltip, InfoTooltip, Toaster |
| Navigation | Tabs, Accordion, Breadcrumbs, Pagination, Steps, Sidebar, Indexer, Tree |
| Data display | Table, DataTable, DescriptionList, KeyValue, List, Timeline, Stat, Badge, Tags, Avatar, Kbd, CodeSnippet, Carousel |
| Feedback | Alert, Banner, Progress, ProgressCircle, Spinner, Skeleton, EmptyState |
| Layout and type | Stack, Grid, Container, AspectRatio, Card, PageHeader, Separator, ScrollArea, Resizable, Heading, Text |
| Brand and theme | PadaLogo, BrandLogo, Icon, ThemeProvider, ThemeToggle |

## Storybook

The [Pada Storybook](https://main--6ad73b69f7d2adf27e282417.chromatic.com) shows the React components and, through Storybook composition, the [Angular Storybook](https://main--6ad72a0038bb5d0de784c60f.chromatic.com) in the same sidebar. Both are published to Chromatic on every push to `main`. The toolbar switches every theme axis, and the Accessibility panel runs axe against the current story.

## Releases

Pada follows [semantic versioning](https://semver.org). `pada-ds` and `pada-ds-angular` are released together, with the same version number.

- **Release notes:** [GitHub Releases](https://github.com/supreeth-kashyap/pada-ds-angular/releases), written from [`CHANGELOG.md`](./CHANGELOG.md).
- **npm:** [`pada-ds-angular`](https://www.npmjs.com/package/pada-ds-angular), published with provenance.
- **GitHub Packages:** also published as `@supreeth-kashyap/pada-ds-angular` and listed under this repository's Packages. Installing from there needs an `.npmrc` line (`@supreeth-kashyap:registry=https://npm.pkg.github.com`) and a GitHub token with `read:packages`; npm is the simpler route.

To cut a release: bump the version, move the changes under a new heading in `CHANGELOG.md`, merge to `main`, then push a matching tag (`git tag v1.2.0 && git push origin v1.2.0`). The release workflow checks the tag, runs the tests, publishes both packages and creates the GitHub Release.

## Development

```bash
npm install
npm start             # app on http://localhost:4200
npm run storybook     # Storybook on http://localhost:6006
npm run test:lib      # Vitest, Testing Library and axe
npm run build:lib     # both entry points into dist/pada-ds-angular
npm run check         # tokens, lint, tests and both builds
```

Read [`CLAUDE.md`](CLAUDE.md) for the rules every component follows and [`docs/contributing.md`](docs/contributing.md) for how to build one. The token files are synced from React and never edited by hand.

## Contributing, security and licence

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request, and report vulnerabilities privately as described in [SECURITY.md](./SECURITY.md). Pada is released under the [MIT licence](./LICENSE).
