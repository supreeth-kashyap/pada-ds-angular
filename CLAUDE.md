# Angular Design System — Blueprint

## Architecture: Data-Driven Components

### Core Principle

Components are pure renderers. They own no data-fetching logic. All data originates from backend services, is transformed into a typed component interface, and passed in via a signal input (`input.required<T>()`). The component's only job is to render what it receives.

```
Backend API (JSON)
      │
      ▼
  Adapter / Mapper          ← transforms raw API shape → component interface
      │
      ▼
  Component input()         ← typed interface, not raw API types
      │
      ▼
  Template renders          ← no business logic, pure presentation
```

---

### Layer Responsibilities

#### 1. Backend JSON
Raw API response. Shape is owned by the backend and may change. Never use it directly in component templates.

#### 2. Adapter (Mapper)
A pure function or service that maps raw API JSON → component input interface.
- Lives outside the component (e.g. `adapters/` or co-located in the feature)
- Handles nullability, defaults, shape normalization
- Is the only place that knows about the raw API shape

#### 3. Component Interface (`ComponentNameData`)
A TypeScript interface that defines exactly what the component needs to render.
- Named `<ComponentName>Data` (e.g. `ButtonData`, `CardData`, `TableData`)
- No optional fields unless the component genuinely handles absence
- Lives in the component's own file or a sibling `types.ts`

#### 4. Component
- Accepts one primary `data = input.required<ComponentNameData>()`
- Emits events via `output<T>()` — never `EventEmitter`
- Uses `changeDetection: ChangeDetectionStrategy.OnPush`
- No HTTP calls, no service injections for data
- Derived state is a `computed()` of `data()`, not a method called from the template
- Template is a pure function of `data()`

---

### Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Component input interface | `<Name>Data` | `CardData` |
| Adapter function | `to<Name>Data` | `toCardData(api)` |
| Component selector | `ds-<name>` | `ds-card` |
| Component file | `<name>.ts` | `card.ts` |

---

### File Layout (per component)

```
src/app/components/<name>/
├── <name>.ts           # Component + ComponentNameData interface
├── <name>.html         # Template
├── <name>.scss         # Scoped styles
├── <name>.spec.ts      # Unit tests (pass data directly, no mocks needed)
└── <name>.adapter.ts   # toNameData() mapper (if non-trivial)
```

---

### Example Skeleton

```typescript
// card.ts

export interface CardData {
  title: string;
  subtitle: string;
  imageUrl: string;
  badge?: string;
}

@Component({
  selector: 'ds-card',
  standalone: true,
  templateUrl: './card.html',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  readonly data = input.required<CardData>();
  readonly selected = output<void>();
}
```

```typescript
// card.adapter.ts

import type { ApiCardResponse } from '../../types/api';
import type { CardData } from './card';

export function toCardData(api: ApiCardResponse): CardData {
  return {
    title: api.title ?? 'Untitled',
    subtitle: api.description ?? '',
    imageUrl: api.media?.url ?? '',
    badge: api.tags?.[0] ?? undefined,
  };
}
```

---

### Testing Strategy

Because components receive plain data objects, tests require no HTTP mocking or service setup:

```typescript
it('renders title', async () => {
  const fixture = TestBed.createComponent(CardComponent);
  fixture.componentRef.setInput('data', { title: 'Hello', subtitle: '', imageUrl: '' });
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('h2').textContent).toBe('Hello');
});
```

Adapter functions are tested as pure functions — input in, output out, no Angular TestBed needed.

---

### Rules

1. **No raw API types in component inputs.** Always adapt first.
2. **No service injection in leaf components.** Data flows down via `input.required<T>()`; events flow up via `output<T>()`. No `@Input`, `@Output` or `EventEmitter`.
3. **Every component is OnPush.** Read inputs as signals (`data()`) in templates and `computed()`s.
4. **Adapters are pure functions.** No side effects, no injection.
5. **Interfaces are the contract.** If the API changes, only the adapter changes — the component stays stable.
