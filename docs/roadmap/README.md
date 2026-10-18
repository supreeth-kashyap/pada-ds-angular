# Pada 2.0 Roadmap: Angular

The master roadmap lives in the React repo: [`pada/docs/roadmap`](https://github.com/supreeth-kashyap/pada/tree/main/docs/roadmap). It covers the token architecture, the headless model, the component list, motion, brand and the marketing site for **both** frameworks. This document covers only what is specific to the Angular library.

- [Parity matrix](./parity.md) (copied from the master `08-parity.md`)
- [Proposed CLAUDE.md amendment](./claude-md-amendment.md)

## Goal

Bring `pada-ds-angular` to **full parity** with React Pada 2.0: the same components, parts, keyboard maps, tokens and motion, built the Angular way (signals, standalone components, `@angular/cdk`).

Today the library has 5 components (Avatar, Badge, Button, InfoIcon, InfoTooltip). The app holds the Attributes family. React has 41 components. See the [parity matrix](./parity.md).

## Phase 0: infrastructure cleanup

These are prerequisites for everything else.

| Task | Detail |
|---|---|
| Add ng-packagr | `ng-packagr` is not in `devDependencies` (it only appears in the lockfile as an optional peer), so `ng build pada-ds` fails on a clean install |
| Rename the package | `projects/pada-ds/package.json` is named `pada-ds`, the same as the React package on npm. Rename to **`pada-ds-angular`**; update the `tsconfig.json` path alias and imports |
| Library test target | Add a `test` target to the `pada-ds` project in `angular.json` (`@angular/build:unit-test`) and a `tsconfig.spec.json` for the library |
| Move specs | Move `src/app/components/{avatar,badge,button,info-tooltip}/*.spec.ts` to `projects/pada-ds/src/lib/<name>/`, matching the CLAUDE.md file layout |
| Delete orphans | Delete the unused `.html`/`.scss` duplicates under `src/app/components/{avatar,badge,button,info-tooltip}` and the re-export shim `.ts` files; update imports in `attributes/**` to `'pada-ds-angular'` |
| Move Attributes | Move `ds-attributes`, `ds-section-header`, `ds-attribute-row` and the value renderers into the library (as `DescriptionList` in phase 3) |
| Stale file | Delete `src/app/thumbnail-value.ts` (the app imports `src/app/demo/thumbnail-value.ts`) |
| Scripts | Add `build:lib`, `test:lib`, `lint` (angular-eslint) and `tokens:check` scripts |
| CI | GitHub Actions: install, `tokens:check`, lint, `test:lib`, `build:lib`, app build |
| Secrets | `.vscode/mcp.json` holds a plaintext Figma API key. It is gitignored, but rotate the key and move it to an environment variable |

## Phase 1: tokens

Decision: tokens are **generated in the React repo and copied here**.

- `npm run tokens:sync -- ../pada-ds-angular` (run in the React repo) writes:
  - `projects/pada-ds/src/styles/tokens.css`: all `--pada-*` custom properties and themes
  - `projects/pada-ds/src/styles/_tokens.scss`: breakpoints, mixins (`@include pada.media(md)`), and SCSS maps for docs
- Both files start with a header: `/* pada-tokens v<version> sha256:<hash> - generated, do not edit */`.
- `npm run tokens:check` here recomputes the hash and fails CI if a file was hand-edited.
- `ng-package.json` lists the styles folder in `assets`, and the library `package.json` exports `./tokens.css` and `./styles.css`, matching the React package's entry points.
- All hard-coded values in the current SCSS (`#f7f7f7`, `#ebebeb`, `#333333`, `#0066cc`, `'Antique Legacy'`, `'Open Sans'` …) are replaced with tier 1 to 3 tokens. Fonts align with React (`--pada-font-sans`).
- Component styles keep `ViewEncapsulation.Emulated` but read only CSS custom properties, so theming works through encapsulation.

## Phase 2: headless core on the CDK

A secondary entry point **`pada-ds-angular/headless`** (`projects/pada-ds/headless/ng-package.json`) contains directives only: no styles, no templates beyond what is structurally required.

| Concern | Angular implementation |
|---|---|
| Overlays (Dialog, Popover, Menu, Tooltip, Select) | CDK `Overlay`, `FlexibleConnectedPositionStrategy`, `OverlayRef` scroll strategies |
| Focus trap / restore | CDK `A11yModule` `FocusTrap`, `FocusMonitor` |
| List and roving navigation | CDK `ActiveDescendantKeyManager`, `FocusKeyManager` (typeahead, skip disabled, Home/End) |
| Live regions (Toast) | CDK `LiveAnnouncer` |
| Dismiss (Escape, outside click) | CDK overlay `keydownEvents()` / `outsidePointerEvents()`, wrapped in one `DsDismissable` directive |
| Controlled / uncontrolled | `model()` signals (`[(open)]`, `[(value)]`) |
| Ids | `inject(_IdGenerator)` or a small `DsIdService` (replaces the module-level `nextId++` in `info-tooltip.ts`) |
| Exit animations | Native **`animate.enter` / `animate.leave`** (Angular 20.2+). Do not add the legacy `@angular/animations` package |
| Drag and drop (List reorder) | CDK `DragDrop` with keyboard support added |
| State attributes | Host bindings: `[attr.data-state]`, `[attr.data-disabled]`, `[attr.aria-expanded]` … exactly as the shared spec lists |

**Pattern:** headless directives coordinate through DI (a child such as `dsDialogClose` injects its parent `DsDialog`). Styled components compose them with `hostDirectives`:

```ts
@Component({
  selector: 'ds-dialog-content',
  hostDirectives: [{ directive: DsDialogContent, inputs: ['size'] }],
  templateUrl: './dialog-content.html',
  styleUrl: './dialog-content.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogContentComponent {}
```

Order of work matches React: overlays first (Dialog, Popover, Tooltip, DropdownMenu), because they need the most shared infrastructure.

## Phases 3 to 6: components

Follow the master [components plan](https://github.com/supreeth-kashyap/pada/blob/main/docs/roadmap/04-components.md) and the [parity matrix](./parity.md). For each component:

1. Read the shared spec (`specs/<component>.md`, copied from React).
2. Build the headless directives.
3. Build the styled component(s) with `hostDirectives`, tier 3 tokens and the motion from the spec.
4. Port the spec's keyboard scenarios to Vitest + TestBed.
5. Add a showcase page in `src/app`.

### Angular-specific considerations

- **Data components vs. composable components.** Components that render a list of records (Table rows, DescriptionList, Steps, Breadcrumbs from data, Toolbar actions) keep the CLAUDE.md data-driven pattern (`input.required<XData>()` + adapter). Components whose structure varies per use (Dialog, Popover, Menu, Card, Field) use content projection and directives. See the [CLAUDE.md amendment](./claude-md-amendment.md).
- **Forms.** Every form control implements `ControlValueAccessor` so it works with Reactive and Template-driven forms, and with Signal Forms when they are stable.
- **SSR / hydration.** Overlays render only in the browser (`afterNextRender`); components must not touch `document` during server rendering.
- **Zoneless.** All components work with `provideZonelessChangeDetection()`; the showcase app runs zoneless to prove it.
- **The `AttributeButtonValueComponent` callback input** (`onClicked = input<() => void>()`) is replaced by an `output()` once the value renderers no longer go through `NgComponentOutlet`, or by `NgComponentOutlet`'s outputs support.

## Phase 7+: brand, site and release

- Add the `PadaLogo` component (mark, wordmark, lockup) when the brand assets land.
- The marketing site (`pada-site`) embeds Angular examples through StackBlitz.
- Version: align to **2.0.0** with React when the parity matrix is complete; until then publish `0.x` previews.
- Generate a `manifest.json` / `llms.txt` with the same shape as React's, from the library's public API.
