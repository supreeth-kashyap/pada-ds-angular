import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface AvatarData {
  alt: string;
  src?: string;      // image URL — takes priority
  initials?: string; // shown when no src
  // when neither src nor initials, renders the user icon (FillType=Unknown)
}

@Component({
  selector: 'ds-avatar',
  standalone: true,
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  readonly data = input.required<AvatarData>();
}
