import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import InlineEditor from '../InlineEditor.svelte';

describe('InlineEditor', () => {
  it('renders span in read mode', () => {
    const { container } = render(InlineEditor, {
      props: { value: 'hello', isEditing: false, ariaLabel: 'Name' },
    });
    expect(container.querySelector('.inline-read')).toBeTruthy();
    expect(container.querySelector('input')).toBeNull();
  });

  it('renders input in edit mode (single-line)', () => {
    const { container } = render(InlineEditor, {
      props: { value: 'hello', isEditing: true, ariaLabel: 'Name' },
    });
    expect(container.querySelector('input')).toBeTruthy();
  });

  it('renders textarea in edit mode (multiline)', () => {
    const { container } = render(InlineEditor, {
      props: { value: 'hello', isEditing: true, multiline: true, ariaLabel: 'Bio' },
    });
    expect(container.querySelector('textarea')).toBeTruthy();
  });

  it('calls onChange on input', async () => {
    const onChange = vi.fn();
    const { container } = render(InlineEditor, {
      props: { value: '', isEditing: true, onChange, ariaLabel: 'Name' },
    });
    const input = container.querySelector('input') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'new value' } });
    expect(onChange).toHaveBeenCalledWith('new value');
  });

  it('form role applied when editing', () => {
    const { getByRole } = render(InlineEditor, {
      props: { value: '', isEditing: true, ariaLabel: 'Test field' },
    });
    expect(getByRole('form', { name: 'Test field' })).toBeTruthy();
  });

  it('displays value in read span', () => {
    const { getByText } = render(InlineEditor, {
      props: { value: 'My value', isEditing: false, ariaLabel: 'Field' },
    });
    expect(getByText('My value')).toBeTruthy();
  });
});
