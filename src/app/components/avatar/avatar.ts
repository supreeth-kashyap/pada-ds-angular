import { Component, Input } from '@angular/core';

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
})
export class AvatarComponent {
  @Input({ required: true }) data!: AvatarData;
}
