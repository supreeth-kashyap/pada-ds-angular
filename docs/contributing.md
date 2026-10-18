# Building a Pada component for Angular

Every Angular component is a port of its React twin in [`pada-ds`](https://github.com/supreeth-kashyap/pada)
(`src/headless/<Name>` for behaviour, `src/components/<Name>` for the styled layer, its CSS and its
tests). Port the behaviour, the parts, the attributes and the CSS; write it the Angular way.
[`CLAUDE.md`](../CLAUDE.md) has the rules; this page has the patterns. Dialog, Popover, Field,
InputText and Button are the reference implementations.

## Layout and commands

```
projects/pada-ds/
├── headless/src/<name>/<name>.directive.ts (+ .spec.ts)   pada-ds-angular/headless
├── headless/src/utils/                                    shared behaviour (see below)
├── src/lib/<name>/<name>.ts, .html, .scss, .spec.ts       pada-ds-angular
├── src/styles/                                            tokens.css (synced), styles.css, base.css
├── testing/                                               test helpers (settle, axe)
└── test-setup.ts                                          jsdom stubs, jest-dom matchers
```

| Command | What it does |
|---|---|
| `npm run test:lib` | Library tests (Vitest, jsdom) |
| `npm run lint` | angular-eslint, templates included |
| `npm run tokens:check` | Synced token files untouched; styles read only defined, semantic tokens |
| `npm run build:lib` | ng-packagr build of both entry points |
| `npm run check` | All of the above plus the app tests and build |

Export new headless directives from `headless/src/public-api.ts` and styled components from
`src/public-api.ts`. The styled entry point imports the headless one as
`'pada-ds-angular/headless'`, never by relative path.

## Headless utilities

| Utility | Use |
|---|---|
| `uniqueId(prefix)` | Hydration-stable ids. Call in a field initializer. |
| `injectButtonType()` | Gives a `<button>` host `type="button"` unless it has a type. Returns the host element. |
| `dataFlag(bool)`, `openState(bool)`, `checkedState(v)` | Values for `data-*` host bindings |
| `*dsPresence="open()"` | Renders an element while open and keeps it until its exit transition ends |
| `DsFloating` (host directive) + `FLOATING_INPUTS` | `side`, `align`, offsets, collisions; sets `data-side` / `data-align` |
| `DsFloatingContext` (root `providers`) + `dsFloatingArrow` | Arrow registration through the root |
| `injectFloatingLayer({ open, anchor, dismiss?, focus?, modal? })` | Top layer, positioning, dismiss and focus for a floating content part |
| `createDismissable(el, options)` | Escape and outside interactions with layer stacking |
| `createFocusScope(el, options)` | Focus in, trap, and restore (`closing()` then `destroy()`) |
| `lockScroll()`, `hideOthers(el)` | Modal helpers |
| `findNextIndex`, `keyToNavigation`, `findTypeaheadIndex`, `createTypeahead` | Roving focus and type-ahead over item lists |
| `byDocumentOrder` | Sorts registered item elements into DOM order |
| `injectControlStatus(accessor?)` | Angular forms state as signals, and value-accessor registration |
| `DsVisuallyHidden` | Screen-reader-only content |

## Headless patterns

### Root, trigger, content

The root holds state and ids; it renders nothing and works on an `<ng-container>`:

```ts
@Directive({ selector: '[dsPopover]', exportAs: 'dsPopover', providers: [DsFloatingContext] })
export class DsPopover {
  readonly open = model(false);
  readonly contentId = uniqueId('ds-popover-');
  readonly trigger = signal<HTMLElement | null>(null);
  setOpen(open: boolean) { this.open.set(open); }
}
```

Triggers register their element with the root in `ngOnInit` and clear it in `ngOnDestroy`. Click
handlers check `event.defaultPrevented` first, so consumers can opt out by calling
`preventDefault()` in their own `(click)`.

Content parts are rendered by the consumer (or the styled template) with `*dsPresence`, so they
mount on open and animate out on close:

```html
<div *dsPresence="popover.open()" dsPopoverContent>…</div>
```

### Children register with the root

A styled component often renders its content element inside its own template
(`ds-popover-content` renders `<div dsPopoverContent>`). Children the consumer projects into it
(`ds-popover-arrow`, menu items, tab triggers) cannot inject a directive that lives in that
template. So children always register with the **root** (or a context the root provides), which
is an ancestor in the consumer's template in both the headless and the styled case.

### Overlays

- **Modal dialogs** (Dialog, AlertDialog, Drawer, Sheet, CommandPalette): a native `<dialog>`
  with `dsDialogContent`. `showModal()` puts it in the top layer and makes the rest of the page
  inert; style the backdrop with `::backdrop`. Reuse `DsDialog` / `DsDialogContent` rather than
  writing a new modal.
- **Floating parts** (Popover, menus, Tooltip, HoverCard, Select and combobox lists): include
  `DsFloating` as a host directive with `inputs: [...FLOATING_INPUTS]` and call
  `injectFloatingLayer` from the constructor. The element stays in place in the DOM (so it
  inherits theme attributes and styles) and joins the top layer through `popover="manual"`.
- Overlays are never moved to `<body>`, and the CDK overlay is not used.
- Mark every layer `data-pada-layer` (host attribute) so focus traps and hide-others skip it.

### Lists, roving focus and type-ahead

Items register with the root in `ngOnInit` (`root.register(this)`) and unregister in
`ngOnDestroy`. The root keeps them in a signal and sorts by `byDocumentOrder` when it needs
order. Keyboard handling lives on the container part; it maps keys with `keyToNavigation`,
finds the target with `findNextIndex` (skipping disabled items, optional `loop`) and focuses it.
Roving `tabindex`: the active item gets `0`, the rest `-1`.

### Forms

Value-carrying controls implement `ControlValueAccessor` and register through
`injectControlStatus(this)` instead of providing `NG_VALUE_ACCESSOR` (see `InputTextComponent`):

```ts
readonly value = model('');
private readonly status = injectControlStatus(this);
ngOnInit() { this.status.connect(); }
writeValue(v) { this.value.set(v ?? ''); }
registerOnChange(fn) { this.onChange = fn; }
registerOnTouched(fn) { this.onTouched = fn; }
setDisabledState(disabled) { this.formsDisabled.set(disabled); }
```

`status.invalid()` is true once the control is invalid and touched or dirty; `status.required()`
follows `Validators.required`; `status.disabled()` follows `control.disable()`. The component
works without forms too, through `[(value)]`.

## Styled patterns

- **Root wrapper**: `template: '<ng-content />'`, `:host { display: contents; }`, and the
  headless root as a host directive with its inputs and outputs:
  `hostDirectives: [{ directive: DsPopover, inputs: ['open', 'modal'], outputs: ['openChange'] }]`.
- **Content components** render the headless content part in their template under
  `*dsPresence`, forward the floating inputs and the dismiss/focus outputs, and project
  `<ng-content />`.
- **Simple parts** put the headless directive on the host with `hostDirectives` (titles,
  descriptions) and style `:host`.
- **Native elements** (`button[dsButton]`, `input[dsInput]`) style `:host` and keep native
  semantics.
- **CSS**: port the React CSS. Component tokens are declared on the component's root
  (`:host` or the content element) as `--pada-<component>-*`; variants and sizes reassign them
  under `[data-variant]` / `[data-size]`. Use `:host([data-…])` for host attributes. Keep the
  React motion: `[data-state='closed']` styles plus `@starting-style` for the enter state.
- Use `ds-icon` for icons (built-in names as in React).
- Every public input and output has a doc comment; the root (or main) component's doc comment
  has a usage example. Note deliberate differences from React there.

## Tests

Port the React tests' scenarios. Use Testing Library with template strings:

```ts
const { fixture } = await render(
  `<ds-popover><button dsButton dsPopoverTrigger>Filters</button>…</ds-popover>`,
  { imports: [...PopoverParts, ButtonComponent] },
);
await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
await settle(fixture);
expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
await expectNoA11yViolations(fixture.nativeElement);
```

- `settle(fixture)` (from `testing/settle`) after any interaction that opens, closes or moves
  focus: overlays mount through effects and `afterNextRender`, and dismiss listeners attach on
  a zero-delay timer.
- `expectNoA11yViolations(element)` (from `testing/a11y`) runs axe.
- jsdom has no layout and no top layer: `<dialog>` methods are stubbed in `test-setup.ts`, the
  Popover API is absent (floating parts skip the top layer), and positions are all zero. Test
  behaviour, ARIA and attributes; check layout and motion in a browser.
- Spread parts arrays into `imports`: `imports: [...DialogParts]`.
