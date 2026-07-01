import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import MultiSelect from '../MultiSelect.svelte';

// JSDOM getBoundingClientRect returns 0 for everything, which causes the
// afterUpdate overflow logic to hide all pills. Mock it with realistic widths.
// Trigger needs large width; pills need small width so they fit inside.
beforeEach(() => {
  Element.prototype.getBoundingClientRect = vi.fn().mockImplementation(function (this: Element) {
    const isPill = this.classList?.contains('ms-pill');
    const w = isPill ? 60 : 500;
    return { width: w, height: 32, top: 0, left: 0, bottom: 32, right: w, x: 0, y: 0, toJSON: () => ({}) };
  });
});

const opts = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

const groupedOpts = [
  { label: 'Group 1', options: [{ value: 'a', label: 'Alpha' }] },
  { label: 'Group 2', options: [{ value: 'b', label: 'Beta' }, { value: 'c', label: 'Gamma' }] },
];

describe('MultiSelect', () => {
  it('shows placeholder when no value', () => {
    const { getByText } = render(MultiSelect, {
      props: { options: opts, value: [], onChange: vi.fn(), label: 'Test' },
    });
    expect(getByText('Select options')).toBeTruthy();
  });

  it('shows selected pills when value set', () => {
    const { getByText } = render(MultiSelect, {
      props: { options: opts, value: ['a'], onChange: vi.fn(), label: 'Test' },
    });
    expect(getByText('Alpha')).toBeTruthy();
  });

  it('opens popover on trigger click', async () => {
    const { container } = render(MultiSelect, {
      props: { options: opts, value: [], onChange: vi.fn(), label: 'Test' },
    });
    const trigger = container.querySelector('.ms-trigger') as HTMLElement;
    await fireEvent.click(trigger);
    expect(container.querySelector('.ms-list')).toBeTruthy();
  });

  it('calls onChange with toggled value on option click', async () => {
    const onChange = vi.fn();
    const { container } = render(MultiSelect, {
      props: { options: opts, value: [], onChange, label: 'Test' },
    });
    await fireEvent.click(container.querySelector('.ms-trigger') as HTMLElement);
    const option = container.querySelector('.ms-option') as HTMLElement;
    await fireEvent.click(option);
    expect(onChange).toHaveBeenCalledWith(['a']);
  });

  it('calls onChange with empty array on clear', async () => {
    const onChange = vi.fn();
    const { container } = render(MultiSelect, {
      props: { options: opts, value: ['a', 'b'], onChange, label: 'Test' },
    });
    const clearBtn = container.querySelector('.ms-clear') as HTMLElement;
    await fireEvent.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('renders group labels for grouped options', async () => {
    const { container, getByText } = render(MultiSelect, {
      props: { options: groupedOpts, value: [], onChange: vi.fn(), label: 'Test' },
    });
    await fireEvent.click(container.querySelector('.ms-trigger') as HTMLElement);
    expect(getByText('Group 1')).toBeTruthy();
    expect(getByText('Group 2')).toBeTruthy();
  });

  it('shows error message when error prop set', () => {
    const { getByRole } = render(MultiSelect, {
      props: { options: opts, value: [], onChange: vi.fn(), label: 'Test', error: 'Required' },
    });
    expect(getByRole('alert')).toBeTruthy();
  });

  it('removes single pill on remove button click', async () => {
    const onChange = vi.fn();
    const { container } = render(MultiSelect, {
      props: { options: opts, value: ['a', 'b'], onChange, label: 'Test' },
    });
    const removeBtn = container.querySelector('.ms-pill-remove') as HTMLElement;
    await fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith(['b']);
  });
});
