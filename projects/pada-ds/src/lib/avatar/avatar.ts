import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  forwardRef,
  inject,
  InjectionToken,
  input,
  signal,
} from '@angular/core';
import { dataFlag } from 'pada-ds-angular/headless';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';
export type AvatarStatus = 'online' | 'away' | 'busy' | 'offline';

const COLORS = ['indigo', 'violet', 'pink', 'orange', 'amber', 'emerald', 'teal', 'sky'] as const;

/** Up to two initials: the first letters of the first and last word. */
export const avatarInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
};

/** A stable colour per name, so the same person always gets the same fallback colour. */
const colorOf = (name: string) => {
  let hash = 0;
  for (const character of name) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
};

type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** What an avatar reads from an enclosing `ds-avatar-group`. */
interface AvatarGroupContext {
  readonly size: () => AvatarSize;
  isHidden(avatar: AvatarComponent): boolean;
}

const AVATAR_GROUP = new InjectionToken<AvatarGroupContext>('AvatarGroup');

/**
 * A user or entity picture. Shows the image once it has loaded; until then (or if it fails)
 * shows initials on a colour derived from the name, or a person icon when there is no name.
 *
 * ```html
 * <ds-avatar name="Ada Lovelace" src="/people/ada.png" size="lg" status="online" />
 * <ds-avatar shape="square" name="Pada" />
 * ```
 *
 * Differences from React: `initials` overrides the initials derived from `name` (React always
 * derives them).
 */
@Component({
  selector: 'ds-avatar',
  template: `
    @if (imageStatus() === 'loaded') {
      <img class="avatar-image" [src]="src()" [alt]="accessibleName() ?? ''" />
    } @else if (initialsText()) {
      <span class="avatar-initials" aria-hidden="true">{{ initialsText() }}</span>
    } @else {
      <svg class="avatar-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="9" r="4" fill="currentColor" />
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="currentColor" />
      </svg>
    }
    @if (status(); as status) {
      <span
        class="avatar-status"
        role="img"
        [attr.data-status]="status"
        [attr.aria-label]="status"
      ></span>
    }
  `,
  styleUrl: './avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-color]': 'color()',
    '[attr.data-grouped]': 'grouped',
    '[attr.role]': 'imageStatus() === "loaded" ? null : "img"',
    '[attr.aria-label]': 'imageStatus() === "loaded" ? null : (accessibleName() ?? null)',
    '[attr.hidden]': 'hiddenInGroup() ? "" : null',
  },
})
export class AvatarComponent {
  /** Image URL. Falls back to initials, then a person icon, while loading or on error. */
  readonly src = input<string>();
  /** Person or entity name: the accessible name, and the source of the initials and colour. */
  readonly name = input<string>();
  /** Alternative text for the image when it differs from `name`. */
  readonly alt = input<string>();
  /** Initials to show instead of the ones derived from `name`. */
  readonly initials = input<string>();
  /** xs 20px, sm 24px, md 32px, lg 40px, xl 56px. Inside a group, the group's size wins. @default 'md' */
  readonly size = input<AvatarSize>('md');
  /** Circle for people, square for organisations and projects. @default 'circle' */
  readonly shape = input<AvatarShape>('circle');
  /** Presence dot in the corner. */
  readonly status = input<AvatarStatus>();

  private readonly group = inject(AVATAR_GROUP, { optional: true });
  protected readonly grouped = dataFlag(!!this.group);
  private readonly loaded = signal<{ src: string; status: LoadStatus } | null>(null);

  protected readonly imageStatus = computed<LoadStatus>(() => {
    const src = this.src();
    if (!src) return 'idle';
    const loaded = this.loaded();
    return loaded?.src === src ? loaded.status : 'loading';
  });
  protected readonly accessibleName = computed(() => this.alt() ?? this.name());
  protected readonly initialsText = computed(() => {
    const name = this.name();
    return this.initials() || (name ? avatarInitials(name) : '');
  });
  protected readonly color = computed(() => {
    const name = this.name();
    return name ? colorOf(name) : null;
  });
  protected readonly resolvedSize = computed(() => this.group?.size() ?? this.size());
  protected readonly hiddenInGroup = computed(() => this.group?.isHidden(this) ?? false);

  constructor() {
    // Preload off-DOM, so a broken or slow image never shows; the fallback stays until it loads.
    effect((onCleanup) => {
      const src = this.src();
      if (!src || typeof Image === 'undefined') return;
      let active = true;
      const image = new Image();
      image.onload = () => active && this.loaded.set({ src, status: 'loaded' });
      image.onerror = () => active && this.loaded.set({ src, status: 'error' });
      image.src = src;
      onCleanup(() => (active = false));
    });
  }
}

/**
 * Overlapping avatars with a "+N" overflow counter.
 *
 * ```html
 * <ds-avatar-group label="Project members" [max]="3" size="sm">
 *   @for (member of members; track member.id) {
 *     <ds-avatar [name]="member.name" [src]="member.photo" />
 *   }
 * </ds-avatar-group>
 * ```
 *
 * Avatars past `max` stay in the DOM but are `hidden` (React leaves them out).
 */
@Component({
  selector: 'ds-avatar-group',
  template: `
    <ng-content />
    @if (hiddenCount() > 0) {
      <span class="avatar-group-overflow" role="img" [attr.aria-label]="hiddenCount() + ' more'">
        <span aria-hidden="true">+{{ hiddenCount() }}</span>
      </span>
    }
  `,
  styleUrl: './avatar-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: AVATAR_GROUP, useExisting: forwardRef(() => AvatarGroupComponent) }],
  host: {
    role: 'group',
    '[attr.aria-label]': 'label() ?? null',
    '[attr.data-size]': 'size()',
  },
})
export class AvatarGroupComponent implements AvatarGroupContext {
  /** Shows at most this many avatars, then a "+N" counter. */
  readonly max = input<number>();
  /** Size applied to every avatar in the group. @default 'md' */
  readonly size = input<AvatarSize>('md');
  /** Accessible name of the group, e.g. "Project members". */
  readonly label = input<string>();

  private readonly avatars = contentChildren(AvatarComponent);

  protected readonly hiddenCount = computed(() => {
    const max = this.max();
    return max === undefined ? 0 : Math.max(0, this.avatars().length - max);
  });

  isHidden(avatar: AvatarComponent): boolean {
    const max = this.max();
    return max !== undefined && this.avatars().indexOf(avatar) >= max;
  }
}
