// Public surface of the design system. Consumers (including the showcase app) import from here only,
// so this file can become the library's `public-api.ts` once the components move to `projects/pada-ds-angular`.

export { BadgeComponent } from './badge/badge';
export type { BadgeData } from './badge/badge';

export { AvatarComponent } from './avatar/avatar';
export type { AvatarData } from './avatar/avatar';

export { ButtonComponent } from './button/button';
export type { ButtonData } from './button/button';

export { AttributesComponent } from './attributes/attributes';
export type { AttributeSection, AttributesData, AttributesEvent } from './attributes/attributes';
export type { AttributeRowData, AttributeValue } from './attributes/sub-components/attribute-row/attribute-row';
export type { SectionHeaderData, SectionSlotItem } from './attributes/sub-components/section-header/section-header';
