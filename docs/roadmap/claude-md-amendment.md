# Proposed CLAUDE.md amendment

**Status: proposal.** Not yet applied to `CLAUDE.md`. Adopt it when phase 2 (headless core) starts.

## Why

The current `CLAUDE.md` says every component accepts one `data = input.required<XData>()` and renders only from it. That works well for components that display records (attributes, table rows, steps), but it rules out the composition a headless design system needs:

- A dialog's content is arbitrary markup, not a data object.
- Headless behaviour has to attach to the consumer's own elements (directives), not to a fixed template.
- Overlays, menus and fields are assembled from parts.

The amendment keeps the data-driven rule for data components and adds rules for headless directives and composable components. The OnPush, signals, `output()` and `computed()` rules are unchanged.

## Proposed text

Replace the **Core Principle**, **Component** and **Rules** sections with the following (the Adapter, Naming, Testing sections stay, with additions noted).

---

### Core Principle

The library has **two layers**:

1. **Headless directives** (`pada-ds-angular/headless`): behaviour, keyboard handling, focus, ARIA and state attributes. No styles.
2. **Styled components** (`pada-ds-angular`): the Pada look, built only from tokens, composing headless directives through `hostDirectives`.

Styled components come in two kinds:

- **Data components** render records (Attributes/DescriptionList, Table rows, Steps, Breadcrumbs from data, Toolbar actions). They follow the data-driven pattern: one `data = input.required<XData>()`, an adapter for raw API shapes, and a template that is a pure function of `data()`.
- **Composable components** have structure that changes per use (Dialog, Popover, Menu, Card, Field, Tabs). They use content projection and parts (`ds-dialog-content`, `ds-dialog-title` …) and take small, primitive signal inputs (`size`, `variant`, `disabled`) instead of a single data object.

No component, in either layer, fetches data or injects data services.

### Headless directives

- Selector prefix `ds` in camelCase attribute form: `[dsDialogTrigger]`, `[dsMenuItem]`.
- Inputs are signal inputs (`input()`, `input.required()`); two-way state uses `model()`.
- Events use `output()`.
- State is exposed only through host attribute bindings (`data-state`, `data-disabled`, `data-side`, `aria-*`) defined in the component's shared spec.
- Directives coordinate through DI (children inject their parent directive), never through global DOM queries.
- May inject CDK services (`Overlay`, `FocusTrapFactory`, `LiveAnnouncer`, `Directionality`) and other headless directives. May not inject data services.

### Styled components

- `changeDetection: ChangeDetectionStrategy.OnPush`, standalone.
- Compose headless directives with `hostDirectives`, forwarding the inputs and outputs consumers need.
- Styles use only `--pada-*` tokens (tiers 1 to 3); variants set `data-*` attributes that reassign component tokens. No hard-coded colours, sizes, z-index or durations.
- Derived state is `computed()`, not template method calls.
- Enter/leave motion uses native `animate.enter` / `animate.leave`, not `@angular/animations`.
- Form controls implement `ControlValueAccessor`.

### Rules

1. **No raw API types in component inputs.** Data components adapt first.
2. **No data-service injection in any component or directive.** Headless directives may inject CDK and other headless directives only.
3. **Signals everywhere.** `input()`, `input.required()`, `model()`, `output()`, `computed()`. No `@Input`, `@Output` or `EventEmitter`.
4. **Every styled component is OnPush.**
5. **State lives in attributes.** Never toggle state classes; bind `data-*` and `aria-*`.
6. **Tokens only.** Component SCSS reads `--pada-*` custom properties; the synced `tokens.css` is never edited by hand.
7. **Adapters are pure functions.**
8. **Specs are the contract.** Parts, attributes, keyboard maps and tokens follow `specs/<component>.md`, shared with the React repo.

### File layout additions

```
projects/pada-ds/
├── headless/                     secondary entry point: pada-ds-angular/headless
│   ├── ng-package.json
│   └── src/<name>/<name>.directive.ts (+ .spec.ts)
├── src/lib/<name>/               styled component (layout as today)
└── src/styles/                   tokens.css, _tokens.scss (synced from React; do not edit)
```

### Testing additions

- Headless directives are tested on a small host component in the spec file.
- Keyboard scenarios come from the shared spec, so React and Angular run the same cases.
