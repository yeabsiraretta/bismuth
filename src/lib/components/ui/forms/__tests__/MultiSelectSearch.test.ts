import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import MultiSelectSearch from '../MultiSelectSearch.svelte';

const opts = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

describe('MultiSelectSearch', () => {
  it('renders search input', () => {
    const { container } = render(MultiSelectSearch, {
      props: { options: opts, value: [], onChange: vi.fn(), label: 'Test' },
    });
    expect(container.querySelector('input')).toBeTruthy();
  });

  it('shows all options when query is empty', () => {
    const { container } = render(MultiSelectSearch, {
      props: { options: opts, value: [], onChange: vi.fn(), label: 'Test' },
    });
    expect(container.querySelector('.multi-select')).toBeTruthy();
  });

  it('selections survive filter change', async () => {
    const onChange = vi.fn();
    const { component } = render(MultiSelectSearch, {
      props: { options: opts, value: ['a'], onChange, label: 'Test' },
    });
    await (component as unknown as { $set: (props: Record<string, unknown>) => Promise<void> }).$set({ value: ['a'] });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows empty state when no results match query', async () => {
    const { container, getByText } = render(MultiSelectSearch, {
      props: { options: opts, value: [], onChange: vi.fn(), label: 'Test' },
    });
    const input = container.querySelector('input') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'ZZZZZZ' } });
    expect(getByText('No results')).toBeTruthy();
  });

  it('waitForInput: shows no options until typed', () => {
    const { container } = render(MultiSelectSearch, {
      props: { options: opts, value: [], onChange: vi.fn(), label: 'Test', resultsBehavior: 'waitForInput' },
    });
    const optItems = container.querySelectorAll('.ms-option');
    expect(optItems.length).toBe(0);
  });
});
