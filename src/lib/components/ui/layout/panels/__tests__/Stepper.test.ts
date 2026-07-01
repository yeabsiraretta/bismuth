import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Stepper from '../Stepper.svelte';
import type { StepItem } from '../stepperTypes';

const steps: StepItem[] = [
  { id: 'a', label: 'Step A', state: 'complete' },
  { id: 'b', label: 'Step B', state: 'in-progress', decisionsTotal: 4, decisionsComplete: 2 },
  { id: 'c', label: 'Step C', state: 'empty' },
  { id: 'd', label: 'Step D', state: 'disabled' },
];

describe('Stepper', () => {
  it('renders nav landmark', () => {
    const { getByRole } = render(Stepper, { props: { steps } });
    expect(getByRole('navigation', { name: 'Form steps' })).toBeTruthy();
  });

  it('renders all step labels', () => {
    const { getByText } = render(Stepper, { props: { steps } });
    expect(getByText('Step A')).toBeTruthy();
    expect(getByText('Step B')).toBeTruthy();
    expect(getByText('Step C')).toBeTruthy();
    expect(getByText('Step D')).toBeTruthy();
  });

  it('marks active step with data-active', () => {
    const { container } = render(Stepper, { props: { steps, activeStepId: 'b' } });
    const activeItem = container.querySelector('[data-active="true"]');
    expect(activeItem).toBeTruthy();
  });

  it('calls onStepClick when enabled step clicked', async () => {
    const onStepClick = vi.fn();
    const { getAllByRole } = render(Stepper, { props: { steps, onStepClick } });
    const buttons = getAllByRole('button');
    await fireEvent.click(buttons[0]);
    expect(onStepClick).toHaveBeenCalledWith('a');
  });

  it('does not call onStepClick for disabled step', async () => {
    const onStepClick = vi.fn();
    const { getAllByRole } = render(Stepper, { props: { steps, onStepClick } });
    const buttons = getAllByRole('button');
    await fireEvent.click(buttons[3]);
    expect(onStepClick).not.toHaveBeenCalled();
  });

  it('renders sub-steps when activeStepId matches step with subSteps', () => {
    const stepsWithSubs: StepItem[] = [
      { id: 'x', label: 'Step X', subSteps: [{ id: 's1', label: 'Sub 1' }, { id: 's2', label: 'Sub 2' }] },
    ];
    const { getByText } = render(Stepper, { props: { steps: stepsWithSubs, activeStepId: 'x' } });
    expect(getByText('Sub 1')).toBeTruthy();
    expect(getByText('Sub 2')).toBeTruthy();
  });

  it('shows decision count when provided', () => {
    const { getByText } = render(Stepper, { props: { steps } });
    expect(getByText('2/4')).toBeTruthy();
  });
});
