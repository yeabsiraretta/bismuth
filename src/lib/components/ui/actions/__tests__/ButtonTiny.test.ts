import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import ButtonTiny from '../ButtonTiny.svelte';

describe('ButtonTiny', () => {
  it('renders as button element', () => {
    const { container } = render(ButtonTiny, { props: {} });
    expect(container.querySelector('button')).toBeTruthy();
  });

  it('applies variant class', () => {
    const { container } = render(ButtonTiny, { props: { variant: 'primary' } });
    expect(container.querySelector('.btn-tiny-primary')).toBeTruthy();
  });

  it('applies secondary by default', () => {
    const { container } = render(ButtonTiny, { props: {} });
    expect(container.querySelector('.btn-tiny-secondary')).toBeTruthy();
  });

  it('applies tertiary class', () => {
    const { container } = render(ButtonTiny, { props: { variant: 'tertiary' } });
    expect(container.querySelector('.btn-tiny-tertiary')).toBeTruthy();
  });

  it('applies icon-only class when iconOnly=true', () => {
    const { container } = render(ButtonTiny, { props: { iconOnly: true, ariaLabel: 'Test' } });
    expect(container.querySelector('.btn-tiny-icon-only')).toBeTruthy();
  });

  it('sets aria-label from ariaLabel prop', () => {
    const { container } = render(ButtonTiny, { props: { ariaLabel: 'Delete item' } });
    expect(container.querySelector('button')?.getAttribute('aria-label')).toBe('Delete item');
  });

  it('sets HTML disabled attribute when disabled=true', () => {
    const { container } = render(ButtonTiny, { props: { disabled: true } });
    expect(container.querySelector('button')?.disabled).toBe(true);
  });

  it('fires click event when not disabled', async () => {
    const onClick = vi.fn();
    const { container, component } = render(ButtonTiny, { props: {} });
    (component as unknown as { $on: (event: string, handler: () => void) => void }).$on(
      'click',
      onClick
    );
    await fireEvent.click(container.querySelector('button') as HTMLElement);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
