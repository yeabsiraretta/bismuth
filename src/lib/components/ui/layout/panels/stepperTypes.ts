export type StepState = 'empty' | 'in-progress' | 'complete' | 'disabled';

export interface SubStep {
  id: string;
  label: string;
  complete?: boolean;
}

export interface StepItem {
  id: string;
  label: string;
  state?: StepState;
  decisionsTotal?: number;
  decisionsComplete?: number;
  subSteps?: SubStep[];
}
