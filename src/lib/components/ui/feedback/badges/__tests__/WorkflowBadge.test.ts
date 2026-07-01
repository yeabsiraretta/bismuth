import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import WorkflowBadge from '../WorkflowBadge.svelte';
import type { WorkflowCategory } from '../workflowBadgeTypes';

const categories: WorkflowCategory[] = [
  'draft',
  'active',
  'complete',
  'blocked',
  'archived',
  'review',
  'published',
  'pending',
];

describe('WorkflowBadge', () => {
  it.each(categories)('renders %s category with correct class', (cat) => {
    const { container } = render(WorkflowBadge, { props: { category: cat, label: cat } });
    expect(container.querySelector(`.workflow-badge-${cat}`)).toBeTruthy();
  });

  it('renders label text', () => {
    const { getByText } = render(WorkflowBadge, {
      props: { category: 'draft', label: 'In Draft' },
    });
    expect(getByText('In Draft')).toBeTruthy();
  });

  it('shows icon when showIcon=true', () => {
    const { container } = render(WorkflowBadge, {
      props: { category: 'complete', label: 'Done', showIcon: true },
    });
    expect(container.querySelector('.wbadge-icon')).toBeTruthy();
    expect(container.querySelector('.wbadge-icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not show icon by default', () => {
    const { container } = render(WorkflowBadge, { props: { category: 'active', label: 'Active' } });
    expect(container.querySelector('.wbadge-icon')).toBeNull();
  });

  it('has role=status and aria-live=polite', () => {
    const { container } = render(WorkflowBadge, {
      props: { category: 'pending', label: 'Pending' },
    });
    const el = container.querySelector('.workflow-badge');
    expect(el?.getAttribute('role')).toBe('status');
    expect(el?.getAttribute('aria-live')).toBe('polite');
  });

  it('is not focusable (no tabindex)', () => {
    const { container } = render(WorkflowBadge, { props: { category: 'review', label: 'Review' } });
    const el = container.querySelector('.workflow-badge');
    expect(el?.getAttribute('tabindex')).toBeNull();
  });
});
