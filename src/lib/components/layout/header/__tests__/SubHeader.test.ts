import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import SubHeader from '../SubHeader.svelte';

describe('SubHeader', () => {
  it('renders heading as H1', () => {
    const { getByRole } = render(SubHeader, { props: { heading: 'My Page' } });
    const h1 = getByRole('heading', { level: 1 });
    expect(h1.textContent).toContain('My Page');
  });

  it('renders breadcrumb nav when breadcrumbs provided', () => {
    const { getByRole } = render(SubHeader, {
      props: {
        heading: 'Detail',
        breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Detail' }],
      },
    });
    expect(getByRole('navigation', { name: 'Breadcrumb' })).toBeTruthy();
  });

  it('marks last breadcrumb as current page', () => {
    const { container } = render(SubHeader, {
      props: {
        heading: 'Detail',
        breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Detail' }],
      },
    });
    const current = container.querySelector('[aria-current="page"]');
    expect(current?.textContent).toBe('Detail');
  });

  it('does not render breadcrumb when none provided', () => {
    const { queryByRole } = render(SubHeader, { props: { heading: 'Page' } });
    expect(queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull();
  });

  it('renders WorkflowBadge when category+label provided', () => {
    const { container } = render(SubHeader, {
      props: { heading: 'Page', badgeCategory: 'draft', badgeLabel: 'Draft' },
    });
    expect(container.querySelector('.workflow-badge')).toBeTruthy();
  });

  it('has section landmark with correct aria-label', () => {
    const { getByRole } = render(SubHeader, { props: { heading: 'Test' } });
    expect(getByRole('region', { name: 'Page sub-header' })).toBeTruthy();
  });
});
