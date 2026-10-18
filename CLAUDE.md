# Pada for Angular — Blueprint

The library (`projects/pada-ds`, published as `pada-ds-angular`) is the Angular twin of the React
`pada-ds`. Same components, parts, keyboard maps, tokens and motion; built the Angular way.
How to build a component, step by step: [`docs/contributing.md`](docs/contributing.md).

## Two layers

1. **Headless directives** (`pada-ds-angular/headless`, in `projects/pada-ds/headless`):
   behaviour, keyboard handling, focus, ARIA and state attributes. No styles, no templates
   beyond what is structurally required.
2. **Styled components** (`pada-ds-angular`, in `projects/pada-ds/src/lib`): the Pada look, built
   only from tokens, composing the headless directives through `hostDirectives` or templates.

Styled components come in two kinds:

- **Data components** render records (DescriptionList, Table rows, Steps, Breadcrumbs from
  data, Timeline, Tree, DataTable). They take one `data = input.required<XData>()` (or a small
  set of typed record inputs), an adapter maps raw API shapes, and the template is a pure
  function of the inputs.
- **Composable components** have structure that changes per use (Dialog, Popover, Menu, Card,
  Field, Tabs). They use content projection and parts (`ds-dialog-content`, `ds-dialog-title` …)
  and take small, primitive signal inputs (`size`, `variant`, `disabled`).

No component or directive, in either layer, fetches data or injects data services.

## Data components: data flow

```
Backend API (JSON) → Adapter (toXData) → component input → template renders
```

- **Adapter** (`<name>.adapter.ts`, `toXData(api)`): a pure function; the only place that knows
  the raw API shape. Handles nullability, defaults and shape normalisation.
- **Interface** (`XData`): exactly what the component needs. No optional fields unless the
  component handles absence.

## Headless directives

- Selector prefix `ds`, camelCase attribute: `[dsDialogTrigger]`, `[dsMenuItem]`. Class names
  `Ds<Name>` (`DsDialogTrigger`).
- Signal inputs (`input()`, `input.required()`); two-way state with `model()` (`[(open)]`,
  `[(value)]`); events with `output()`.
- State only through host attribute bindings: `data-state`, `data-disabled`, `data-side`,
  `aria-*`, as the React parts expose them.
- Parts coordinate through DI. **Children register with the root directive** (an ancestor in
  the consumer's template), never with the content part, which a styled component may render
  inside its own template where projected children cannot inject it.
- May inject CDK services and other headless directives. May not inject data services.

## Styled components

- Standalone, `changeDetection: ChangeDetectionStrategy.OnPush`. Selector `ds-<name>` for
  elements, `button[dsButton]`-style attribute selectors on native elements.
- Compose headless directives with `hostDirectives`, forwarding the inputs and outputs
  consumers need.
- Styles read only `--pada-*` tokens (synced `tokens.css`) and component tokens
  (`--pada-<component>-*`) they define. Variants set `data-*` attributes that reassign
  component tokens. No raw colours, no `--pada-ref-*` / `--pada-palette-*`, no hard-coded
  z-index or durations. `npm run tokens:check` enforces this.
- Derived state is `computed()`, never a template method call.
- Form controls implement `ControlValueAccessor` through `injectControlStatus(this)`.
- Exit motion through `*dsPresence`; enter motion through `@starting-style`. Not
  `@angular/animations`.

## Naming

| Artifact | Convention | Example |
|---|---|---|
| Data interface | `<Name>Data` | `TimelineData` |
| Adapter | `to<Name>Data` | `toTimelineData(api)` |
| Element selector | `ds-<name>` | `ds-dialog-content` |
| Native-element component | `el[ds<Name>]` | `button[dsButton]` |
| Headless directive | `[ds<Name>]`, class `Ds<Name>` | `[dsPopoverTrigger]`, `DsPopoverTrigger` |
| Styled component class | `<Name>Component` | `DialogContentComponent` |
| Parts array | `<Name>Parts` / `Ds<Name>Parts` | `DialogParts` |
| File | `<name>.ts`, `<name>.directive.ts` (headless) | `dialog.ts` |

## Rules

1. **No raw API types in component inputs.** Data components adapt first.
2. **No data-service injection anywhere.**
3. **Signals everywhere.** `input()`, `model()`, `output()`, `computed()`. No `@Input`, `@Output`,
   `EventEmitter`.
4. **Every styled component is OnPush.**
5. **State lives in attributes.** Never toggle state classes; bind `data-*` and `aria-*`.
6. **Tokens only.** The synced `tokens.css` and `_tokens.scss` are never edited by hand.
7. **Adapters are pure functions.**
8. **Parity with React.** Parts, attributes, keyboard behaviour and tokens follow the React
   component; differences are deliberate and documented in the component's doc comment.
9. **Every component ships with tests**: behaviour, keyboard, ARIA and an axe check.
