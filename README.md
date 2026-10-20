# Pada for Angular

`pada-ds-angular` is the Angular twin of the React design system [`pada-ds`](https://github.com/supreeth-kashyap/pada): the same components, parts, keyboard maps, tokens and motion, built with signals, standalone components and OnPush change detection.

The library has two entry points:

| Entry point | Contents |
|---|---|
| `pada-ds-angular` | Styled components (`ds-dialog`, `button[dsButton]`, `ds-data-table` …), built only from `--pada-*` tokens |
| `pada-ds-angular/headless` | Directives with the behaviour, keyboard handling, focus, ARIA and state attributes, and no styles (`[dsDialog]`, `[dsMenuItem]`, `[dsToolbar]` …) |

Every component in React `pada-ds` has an Angular counterpart. The [parity matrix](docs/roadmap/parity.md) lists them, with any deliberate differences.

## Using the library

Load the styles once, globally:

```scss
@import 'pada-ds-angular/styles.css'; // tokens (light and dark) and component rules
@import 'pada-ds-angular/base.css';   // optional base element styles
```

Import components (or a component's `Parts` array) into a standalone component:

```ts
import { ButtonComponent, DialogParts } from 'pada-ds-angular';

@Component({
  selector: 'app-profile',
  imports: [ButtonComponent, ...DialogParts],
  template: `
    <ds-dialog [(open)]="editing">
      <button dsButton dsDialogTrigger>Edit profile</button>
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

Form controls implement `ControlValueAccessor`, so they work with reactive and template-driven forms, and also standalone through `[(value)]`. Data components (Table, DataTable, Tree, Timeline, DescriptionList …) take one typed `data` input, which a `to<Name>Data` adapter builds from your API response.

## Development

```bash
npm install
npm start           # placeholder app at http://localhost:4200/
npm run test:lib    # library tests (Vitest, jsdom, axe)
npm run build:lib   # ng-packagr build of both entry points into dist/
npm run check       # tokens:check, lint, all tests, both builds
```

| Path | What it holds |
|---|---|
| `projects/pada-ds/headless/src/` | Headless directives and shared behaviour (`utils/`) |
| `projects/pada-ds/src/lib/` | Styled components, one folder each, with their tests |
| `projects/pada-ds/src/styles/` | `tokens.css` and `_tokens.scss` (synced from React, never edited by hand), `styles.css`, `base.css` |
| `src/` | The app, which `tsconfig.json` points at the library sources |
| `docs/` | [Roadmap](docs/roadmap/README.md), [parity matrix](docs/roadmap/parity.md), [contributing guide](docs/contributing.md) |

Read [`CLAUDE.md`](CLAUDE.md) for the rules and [`docs/contributing.md`](docs/contributing.md) for how to build a component step by step.

## What's left on the roadmap

- A `manifest.json` / `llms.txt` generator with the same shape as React's
- Shared `specs/<component>.md` files and spec-generated keyboard tests
- Storybook for component documentation and examples
- A zoneless app to prove the components work without Zone.js
- Release: `0.x` previews until the 2.0.0 release aligned with React
