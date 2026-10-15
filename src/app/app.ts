import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  AvatarComponent,
  AvatarData,
  BadgeComponent,
  BadgeData,
  ButtonComponent,
  ButtonData,
} from 'pada-ds';
import { AttributesComponent, AttributesData } from './components/attributes/attributes';
import { ThumbnailValueComponent, ThumbnailValueData } from './demo/thumbnail-value';

@Component({
  selector: 'app-root',
  imports: [BadgeComponent, AvatarComponent, ButtonComponent, AttributesComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  badges: BadgeData[] = [
    { label: 'Badge label' },
    { label: 'Draft' },
    { label: 'New' },
    { label: 'In review' },
  ];

  avatars: AvatarData[] = [
    { alt: 'Unknown user' },
    { initials: 'JD', alt: 'Jane Doe' },
    { initials: 'SK', alt: 'Supreeth Kashyap' },
    { src: 'https://i.pravatar.cc/28?img=3', alt: 'User photo' },
  ];

  buttons: ButtonData[] = [
    { label: 'Button Label' },
    { label: 'Save changes' },
    { label: 'Disabled', disabled: true },
  ];

  attributesData: AttributesData = {
    sections: [
      {
        header: { label: 'Section A', tooltip: 'Info about this section' },
        rows: [
          { key: 'Key label', value: [{ type: 'text', text: 'Sample text' }] },
          { key: 'Status', tooltip: 'Current state', value: [{ type: 'badge', label: 'Active' }] },
        ],
      },
      {
        header: {
          label: 'Section B',
          slot: [{ type: 'button', label: 'Action' }],
        },
        rows: [
          {
            key: 'Owner',
            value: [{ type: 'avatar', name: 'Anna Banks', initials: 'AB', subtitle: 'HR @company' }],
          },
          {
            key: 'Edit',
            value: [
              { type: 'text', text: 'Last edited 2 days ago' },
              { type: 'button', label: 'Edit record' },
            ],
          },
          {
            key: 'Preview',
            value: [
              {
                type: 'custom',
                component: ThumbnailValueComponent,
                inputs: {
                  data: {
                    text: 'Brand guidelines cover',
                    imageUrl: 'https://picsum.photos/seed/ds/48/48',
                    imageAlt: 'Brand guidelines thumbnail',
                  } satisfies ThumbnailValueData,
                },
              },
            ],
          },
        ],
      },
    ],
  };
}
