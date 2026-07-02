import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import ProfileMenu from '../ProfileMenu.svelte';

const baseProps = {
  initials: 'AB',
  displayName: 'Alice Brown',
  items: [
    { label: 'Settings', href: '/settings' },
    { label: 'Sign out', onClick: vi.fn() },
  ],
  isOpen: false,
  onToggle: vi.fn(),
};

describe('ProfileMenu', () => {
  it('renders avatar with initials', () => {
    const { getByText } = render(ProfileMenu, { props: baseProps });
    expect(getByText('AB')).toBeTruthy();
  });

  it('trigger has correct aria-label', () => {
    const { container } = render(ProfileMenu, { props: baseProps });
    const btn = container.querySelector('.pm-trigger') as HTMLElement;
    expect(btn.getAttribute('aria-label')).toContain('Alice Brown');
  });

  it('does not render menu when isOpen=false', () => {
    const { queryByRole } = render(ProfileMenu, { props: baseProps });
    expect(queryByRole('menu')).toBeNull();
  });

  it('renders menu when isOpen=true', () => {
    const { getByRole } = render(ProfileMenu, { props: { ...baseProps, isOpen: true } });
    expect(getByRole('menu')).toBeTruthy();
  });

  it('calls onToggle when trigger clicked', async () => {
    const onToggle = vi.fn();
    const { container } = render(ProfileMenu, { props: { ...baseProps, onToggle } });
    await fireEvent.click(container.querySelector('.pm-trigger') as HTMLElement);
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('renders all menu items', () => {
    const { getByText } = render(ProfileMenu, { props: { ...baseProps, isOpen: true } });
    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Sign out')).toBeTruthy();
  });

  it('slices initials to 2 chars', () => {
    const { container } = render(ProfileMenu, {
      props: { ...baseProps, initials: 'ABCDEF' },
    });
    expect(container.querySelector('.pm-avatar')?.textContent).toBe('AB');
  });
});
