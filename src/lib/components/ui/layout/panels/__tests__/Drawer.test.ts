import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';

// Mock focus-trap — JSDOM has no tabbable nodes, which causes unhandled rejections
vi.mock('@/utils/accessibility/focusTrap', () => ({
  createFocusTrap: () => ({
    activate: vi.fn(),
    deactivate: vi.fn(),
  }),
}));

import Drawer from '../Drawer.svelte';

describe('Drawer', () => {
  const baseProps = { title: 'Test Drawer', onClose: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('does not render when open=false', () => {
    const { queryByRole } = render(Drawer, { props: { ...baseProps, open: false } });
    expect(queryByRole('dialog')).toBeNull();
  });

  it('renders dialog when open=true', () => {
    const { getByRole } = render(Drawer, { props: { ...baseProps, open: true } });
    expect(getByRole('dialog')).toBeTruthy();
  });

  it('renders title in dialog', () => {
    const { getByText } = render(Drawer, { props: { ...baseProps, open: true } });
    expect(getByText('Test Drawer')).toBeTruthy();
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    const { getByLabelText } = render(Drawer, { props: { ...baseProps, onClose, open: true } });
    await fireEvent.click(getByLabelText('Close panel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(Drawer, { props: { ...baseProps, onClose, open: true } });
    const backdrop = container.querySelector('.drawer-backdrop') as HTMLElement;
    await fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('sets body overflow hidden when open=true', async () => {
    render(Drawer, { props: { ...baseProps, open: true } });
    await new Promise((r) => setTimeout(r, 0));
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow when component destroyed', async () => {
    document.body.style.overflow = '';
    const { unmount } = render(Drawer, { props: { ...baseProps, open: true } });
    await new Promise((r) => setTimeout(r, 0));
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('renders subtitle when provided', () => {
    const { getByText } = render(Drawer, {
      props: { ...baseProps, open: true, subtitle: 'Sub text' },
    });
    expect(getByText('Sub text')).toBeTruthy();
  });
});
