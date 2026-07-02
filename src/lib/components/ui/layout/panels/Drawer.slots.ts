import type { SlotContract } from '@/types/layout';

export const DrawerSlots: SlotContract = {
  header: {
    name: 'header',
    description: 'Panel header — title, optional subtitle, close button. Auto-rendered from props.',
    mustNotContain: ['scrollable content', 'form fields', 'feature-domain logic'],
    required: true,
  },
  body: {
    name: 'body',
    description: 'Scrollable main content area. Default slot. Owns all panel content.',
    mustNotContain: ['primary CTA buttons', 'accumulated selection summaries'],
    required: true,
  },
  staging: {
    name: 'staging',
    description: 'Fixed zone above footer for accumulated selections or summaries.',
    mustNotContain: ['primary panel content', 'form inputs'],
    required: false,
  },
  footerRegressive: {
    name: 'footerRegressive',
    description: 'Left footer zone — regressive actions (Cancel, Back).',
    mustNotContain: ['primary CTAs', 'progress-advancing actions'],
    required: false,
  },
  footerProgressive: {
    name: 'footerProgressive',
    description: 'Right footer zone — progressive actions (primary CTA, Submit).',
    mustNotContain: ['destructive or back actions'],
    required: false,
  },
};
