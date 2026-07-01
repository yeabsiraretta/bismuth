/**
 * Storyteller Suite — Timeline and Gantt types.
 */

export type TimelineMode = 'standard' | 'gantt';
export type TimelineGroupBy = 'character' | 'location' | 'group' | 'track' | 'era' | 'none';

export interface TimelineEvent {
  id: string;
  entityId: string;
  label: string;
  date: string;
  endDate?: string;
  track?: string;
  era?: string;
  isMilestone: boolean;
  progress?: number;
  dependsOn: string[];
  color?: string;
  tags: string[];
}

export interface TimelineDependency {
  fromId: string;
  toId: string;
  style: 'arrow' | 'dashed' | 'dotted';
}

export interface TimelineEra {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  color: string;
}

export interface TimelineFork {
  id: string;
  name: string;
  parentForkId: string | null;
  eventIds: string[];
  description: string;
}

export interface TimelineConflict {
  eventIds: string[];
  reason: string;
  severity: 'warning' | 'error';
}

export interface TimelineFilter {
  search: string;
  tracks: string[];
  eras: string[];
  milestonesOnly: boolean;
  dateRange: { start: string; end: string } | null;
  groupBy: TimelineGroupBy;
}

export const DEFAULT_TIMELINE_FILTER: TimelineFilter = {
  search: '',
  tracks: [],
  eras: [],
  milestonesOnly: false,
  dateRange: null,
  groupBy: 'none',
};
