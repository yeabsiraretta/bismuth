import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import EventLinkManager from '../EventLinkManager.svelte';

describe('EventLinkManager', () => {
  it('shows empty state when no links', () => {
    const { getByText } = render(EventLinkManager, { props: { linkedNotePaths: [] } });
    expect(getByText('No linked notes')).toBeTruthy();
  });

  it('renders existing linked notes', () => {
    const { getByText } = render(EventLinkManager, {
      props: { linkedNotePaths: ['notes/todo.md', 'journal/day.md'] },
    });
    expect(getByText('notes/todo.md')).toBeTruthy();
    expect(getByText('journal/day.md')).toBeTruthy();
  });

  it('dispatches change with new path on Add click', async () => {
    const onChange = vi.fn();
    const { container, component } = render(EventLinkManager, {
      props: { linkedNotePaths: [] },
    });
    (
      component as unknown as {
        $on: (event: string, handler: (...args: unknown[]) => void) => void;
      }
    ).$on('change', onChange);
    const input = container.querySelector('.link-input') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'new/note.md' } });
    input.value = 'new/note.md';
    const addBtn = container.querySelector('.link-add-btn') as HTMLButtonElement;
    await fireEvent.click(addBtn);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].detail).toContain('new/note.md');
  });

  it('dispatches change without removed path on remove click', async () => {
    const onChange = vi.fn();
    const { container, component } = render(EventLinkManager, {
      props: { linkedNotePaths: ['notes/a.md', 'notes/b.md'] },
    });
    (
      component as unknown as {
        $on: (event: string, handler: (...args: unknown[]) => void) => void;
      }
    ).$on('change', onChange);
    const removeBtn = container.querySelector('.link-remove') as HTMLButtonElement;
    await fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].detail).not.toContain('notes/a.md');
  });
});
