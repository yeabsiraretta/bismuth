import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import EditOnGlass from '../EditOnGlass.svelte';

describe('EditOnGlass', () => {
  it('does not show edit actions when not editing', () => {
    const { queryByText } = render(EditOnGlass, {
      props: {
        isEditing: false,
        isEditable: true,
        onEditStart: vi.fn(),
        onSave: vi.fn(),
        onCancel: vi.fn(),
      },
    });
    expect(queryByText('Save')).toBeNull();
    expect(queryByText('Cancel')).toBeNull();
  });

  it('shows Save and Cancel when isEditing=true', () => {
    const { getByText } = render(EditOnGlass, {
      props: {
        isEditing: true,
        isEditable: true,
        onEditStart: vi.fn(),
        onSave: vi.fn(),
        onCancel: vi.fn(),
      },
    });
    expect(getByText('Save')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('calls onSave when Save clicked', async () => {
    const onSave = vi.fn();
    const { getByText } = render(EditOnGlass, {
      props: { isEditing: true, isEditable: true, onEditStart: vi.fn(), onSave, onCancel: vi.fn() },
    });
    await fireEvent.click(getByText('Save'));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Cancel clicked', async () => {
    const onCancel = vi.fn();
    const { getByText } = render(EditOnGlass, {
      props: { isEditing: true, isEditable: true, onEditStart: vi.fn(), onSave: vi.fn(), onCancel },
    });
    await fireEvent.click(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows lock icon when isEditable=false', () => {
    const { container } = render(EditOnGlass, {
      props: {
        isEditing: false,
        isEditable: false,
        onEditStart: vi.fn(),
        onSave: vi.fn(),
        onCancel: vi.fn(),
      },
    });
    expect(container.querySelector('.eog-lock-icon')).toBeTruthy();
  });

  it('applies is-disabled class when not editable', () => {
    const { container } = render(EditOnGlass, {
      props: {
        isEditing: false,
        isEditable: false,
        onEditStart: vi.fn(),
        onSave: vi.fn(),
        onCancel: vi.fn(),
      },
    });
    expect(container.querySelector('.is-disabled')).toBeTruthy();
  });
});
