import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { CarouselComponent, CarouselParts } from 'pada-ds-angular';
import { landscape } from './sample-images';

const slides = [
  { src: landscape(200, 'Offsite 2026'), alt: 'Team offsite in the mountains' },
  { src: landscape(30, 'Launch day'), alt: 'Launch day celebration' },
  { src: landscape(140, 'Hack week'), alt: 'Hack week demos' },
];

const meta: Meta<CarouselComponent> = {
  title: 'Display/Carousel',
  component: CarouselComponent,
  decorators: [moduleMetadata({ imports: [...CarouselParts] })],
  args: { label: 'Highlights', autoPlay: false, interval: 5000, showDots: true, showNav: true },
  render: (args) => ({
    props: { ...args, slides },
    template: `
      <ds-carousel style="max-width: 560px" [label]="label" [autoPlay]="autoPlay" [interval]="interval" [showDots]="showDots" [showNav]="showNav">
        @for (slide of slides; track slide.alt) {
          <ds-carousel-slide><img [src]="slide.src" [alt]="slide.alt" style="display: block; width: 100%" /></ds-carousel-slide>
        }
      </ds-carousel>`,
  }),
};
export default meta;
type Story = StoryObj<CarouselComponent>;

export const Default: Story = {};
export const AutoPlay: Story = { args: { autoPlay: true } };
export const WithoutDots: Story = { args: { showDots: false } };
export const WithoutNav: Story = { args: { showNav: false } };
