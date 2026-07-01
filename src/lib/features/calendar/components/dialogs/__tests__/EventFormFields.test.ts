import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import EventFormFields from '../EventFormFields.svelte';

const baseProps = {
  title: '',
  itemType: 'event' as const,
  allDay: false,
  startHour: 9,
  startMin: 0,
  durationHours: 1,
  durationMins: 0,
  eventDate: '2026-06-23',
  categoryId: '',
  categories: [],
};

describe('EventFormFields', () => {
  it('renders title input', () => {
    const { container } = render(EventFormFields, { props: baseProps });
    expect(container.querySelector('.input-title')).toBeTruthy();
  });

  it('dispatches change on title input', async () => {
    const { container, component } = render(EventFormFields, { props: baseProps });
    const onChange = vi.fn();
    (component as unknown as { $on: (event: string, handler: (...args: unknown[]) => void) => void }).$on('change', onChange);
    const input = container.querySelector('.input-title') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'My event' } });
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].detail.title).toBe('My event');
  });

  it('renders type selector with 3 buttons', () => {
    const { container } = render(EventFormFields, { props: baseProps });
    const buttons = container.querySelectorAll('.type-btn');
    expect(buttons.length).toBe(3);
  });

  it('hides time inputs when allDay=true', () => {
    const { container } = render(EventFormFields, { props: { ...baseProps, allDay: true } });
    expect(container.querySelector('.time-row')).toBeNull();
  });

  it('shows time inputs when allDay=false', () => {
    const { container } = render(EventFormFields, { props: { ...baseProps, allDay: false } });
    expect(container.querySelector('.time-row')).toBeTruthy();
  });
});
