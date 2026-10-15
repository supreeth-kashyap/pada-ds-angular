# Pada Design System for Angular

A small Angular 21 design system built from data-driven, standalone `ds-` components, plus a showcase app that renders each one.

Every component is a pure renderer. It takes one typed `data` signal input (`input.required<NameData>()`), reports interaction through `output()`, and uses `OnPush` change detection. Raw API responses are mapped to these interfaces by adapters outside the components. See [CLAUDE.md](CLAUDE.md) for the full blueprint.

## Components

| Component | Selector | Input | Output |
|---|---|---|---|
| `BadgeComponent` | `ds-badge` | `BadgeData` | — |
| `AvatarComponent` | `ds-avatar` | `AvatarData` | — |
| `ButtonComponent` | `ds-button` | `ButtonData` | `clicked` |
| `AttributesComponent` | `ds-attributes` | `AttributesData` | `action` (`AttributesEvent`) |

All public components and their data types are exported from [`src/app/components/public-api.ts`](src/app/components/public-api.ts). Import from there rather than from individual component files:

```typescript
import { ButtonComponent, ButtonData } from './components/public-api';

@Component({
  selector: 'app-example',
  imports: [ButtonComponent],
  template: `<ds-button [data]="save" (clicked)="onSave()" />`,
})
export class Example {
  save: ButtonData = { label: 'Save changes' };
  onSave() {}
}
```

`ds-attributes` renders sections of key/value rows. A row value can be `text`, `avatar`, `badge` or `button`. It can also be a `custom` component or a `template` that you pass in, so your own renderers can sit alongside the built-in ones. The showcase uses this for a thumbnail value.

## Development

```bash
npm install
npm start        # showcase app at http://localhost:4200/
npm test         # unit tests (Vitest, jsdom)
npm run build    # production build into dist/
```

Specs pass data straight to `fixture.componentRef.setInput('data', …)`, so they need no HTTP or service mocks. Use `vi.fn()` from Vitest for output spies.

## Roadmap

The components will be packaged as an installable library at `projects/pada-ds-angular`, built with ng-packagr, with the showcase consuming that package. The `public-api.ts` barrel above is the surface that package will export.
