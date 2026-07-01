/**
 * Storyteller Suite — Plotline, beat sheet, narrative mode, and setup/payoff types.
 */

export interface Plotline {
  id: string;
  storyId: string;
  name: string;
  color: string;
  description: string;
  sceneIds: string[];
  sortOrder: number;
}

export type NarrativeMode =
  | 'linear' | 'flashback' | 'flash-forward' | 'parallel'
  | 'frame' | 'simultaneous' | 'time-skip' | 'dream'
  | 'mythic' | 'circular';

export type BeatSheetTemplate =
  | 'save-the-cat' | 'three-act' | 'heros-journey' | 'seven-point'
  | 'story-circle' | 'romancing-the-beat' | '27-chapter' | 'custom';

export interface BeatDefinition {
  id: string;
  name: string;
  description: string;
  act: number;
  sortOrder: number;
}

export interface BeatSheet {
  id: string;
  template: BeatSheetTemplate;
  name: string;
  beats: BeatDefinition[];
}

export interface SetupPayoff {
  id: string;
  storyId: string;
  setupSceneId: string;
  payoffSceneId: string | null;
  description: string;
  resolved: boolean;
}

export interface PlotgridCell {
  sceneId: string | null;
  plotlineId: string;
  text: string;
  color: string | null;
  linkedNoteId: string | null;
}

export interface PlotgridRow {
  sceneId: string;
  cells: Record<string, PlotgridCell>;
}

export interface SwimlaneSetting {
  groupBy: 'pov' | 'character' | 'location' | 'plotline' | 'none';
}

export type SceneColorMode = 'status' | 'pov' | 'emotion' | 'tag' | 'act' | 'custom';

export interface ColorScheme {
  id: string;
  name: string;
  colors: Record<string, string>;
  isBuiltIn: boolean;
}

// ─── Built-in beat sheet templates ──────────────────────────────────────────

export const BUILTIN_BEAT_SHEETS: BeatSheet[] = [
  {
    id: 'save-the-cat', template: 'save-the-cat', name: 'Save the Cat',
    beats: [
      { id: 'opening', name: 'Opening Image', description: 'Visual snapshot of the world before the story begins', act: 1, sortOrder: 0 },
      { id: 'setup', name: 'Set-Up', description: 'Introduce the protagonist and their world', act: 1, sortOrder: 1 },
      { id: 'theme', name: 'Theme Stated', description: 'Someone states the theme, often to the protagonist', act: 1, sortOrder: 2 },
      { id: 'catalyst', name: 'Catalyst', description: 'The inciting incident that changes everything', act: 1, sortOrder: 3 },
      { id: 'debate', name: 'Debate', description: 'Protagonist wrestles with the call to action', act: 1, sortOrder: 4 },
      { id: 'break2', name: 'Break into Two', description: 'Protagonist commits and enters the new world', act: 2, sortOrder: 5 },
      { id: 'bstory', name: 'B Story', description: 'A subplot (often love) that carries the theme', act: 2, sortOrder: 6 },
      { id: 'fun', name: 'Fun & Games', description: 'The promise of the premise delivered', act: 2, sortOrder: 7 },
      { id: 'midpoint', name: 'Midpoint', description: 'False victory or false defeat raises the stakes', act: 2, sortOrder: 8 },
      { id: 'badguys', name: 'Bad Guys Close In', description: 'Opposition regroups and internal doubts surface', act: 2, sortOrder: 9 },
      { id: 'aisil', name: 'All Is Lost', description: 'The protagonist hits rock bottom', act: 2, sortOrder: 10 },
      { id: 'dark', name: 'Dark Night of the Soul', description: 'Moment of despair before the breakthrough', act: 2, sortOrder: 11 },
      { id: 'break3', name: 'Break into Three', description: 'Protagonist finds the solution using A + B story lessons', act: 3, sortOrder: 12 },
      { id: 'finale', name: 'Finale', description: 'Protagonist executes the plan and transforms', act: 3, sortOrder: 13 },
      { id: 'closing', name: 'Final Image', description: 'Mirror of the opening — proof of change', act: 3, sortOrder: 14 },
    ],
  },
  {
    id: 'three-act', template: 'three-act', name: 'Three-Act Structure',
    beats: [
      { id: 'hook', name: 'Hook', description: 'Grab the reader', act: 1, sortOrder: 0 },
      { id: 'inciting', name: 'Inciting Incident', description: 'Event that sets the plot in motion', act: 1, sortOrder: 1 },
      { id: 'plot1', name: 'First Plot Point', description: 'Point of no return', act: 1, sortOrder: 2 },
      { id: 'rising', name: 'Rising Action', description: 'Escalating conflict and stakes', act: 2, sortOrder: 3 },
      { id: 'midpoint', name: 'Midpoint', description: 'Major reversal or revelation', act: 2, sortOrder: 4 },
      { id: 'crisis', name: 'Crisis', description: 'Darkest moment', act: 2, sortOrder: 5 },
      { id: 'plot2', name: 'Second Plot Point', description: 'Final piece falls into place', act: 2, sortOrder: 6 },
      { id: 'climax', name: 'Climax', description: 'Final confrontation', act: 3, sortOrder: 7 },
      { id: 'resolution', name: 'Resolution', description: 'New equilibrium', act: 3, sortOrder: 8 },
    ],
  },
  {
    id: 'heros-journey', template: 'heros-journey', name: "Hero's Journey",
    beats: [
      { id: 'ordinary', name: 'Ordinary World', description: 'The hero in their normal life', act: 1, sortOrder: 0 },
      { id: 'call', name: 'Call to Adventure', description: 'Challenge or quest appears', act: 1, sortOrder: 1 },
      { id: 'refusal', name: 'Refusal of the Call', description: 'Hero hesitates or declines', act: 1, sortOrder: 2 },
      { id: 'mentor', name: 'Meeting the Mentor', description: 'Guide or tool appears', act: 1, sortOrder: 3 },
      { id: 'threshold', name: 'Crossing the Threshold', description: 'Hero enters the special world', act: 2, sortOrder: 4 },
      { id: 'tests', name: 'Tests, Allies, Enemies', description: 'Hero faces trials', act: 2, sortOrder: 5 },
      { id: 'approach', name: 'Approach to the Inmost Cave', description: 'Preparing for the ordeal', act: 2, sortOrder: 6 },
      { id: 'ordeal', name: 'The Ordeal', description: 'The greatest challenge', act: 2, sortOrder: 7 },
      { id: 'reward', name: 'Reward', description: 'Hero seizes the prize', act: 2, sortOrder: 8 },
      { id: 'road-back', name: 'The Road Back', description: 'Hero starts the return journey', act: 3, sortOrder: 9 },
      { id: 'resurrection', name: 'Resurrection', description: 'Final test using everything learned', act: 3, sortOrder: 10 },
      { id: 'return', name: 'Return with the Elixir', description: 'Hero returns home changed', act: 3, sortOrder: 11 },
    ],
  },
  {
    id: 'story-circle', template: 'story-circle', name: 'Story Circle (Dan Harmon)',
    beats: [
      { id: 'you', name: 'You (Comfort Zone)', description: 'Character in their world', act: 1, sortOrder: 0 },
      { id: 'need', name: 'Need (Desire)', description: 'Character wants something', act: 1, sortOrder: 1 },
      { id: 'go', name: 'Go (Unfamiliar)', description: 'Character enters a new situation', act: 2, sortOrder: 2 },
      { id: 'search', name: 'Search (Adapt)', description: 'Character struggles and adapts', act: 2, sortOrder: 3 },
      { id: 'find', name: 'Find (Discovery)', description: 'Character gets what they wanted', act: 2, sortOrder: 4 },
      { id: 'take', name: 'Take (Price)', description: 'Character pays a heavy cost', act: 3, sortOrder: 5 },
      { id: 'return', name: 'Return (Go Back)', description: 'Character returns to the familiar', act: 3, sortOrder: 6 },
      { id: 'change', name: 'Change (Growth)', description: 'Character is fundamentally changed', act: 3, sortOrder: 7 },
    ],
  },
];

export const NARRATIVE_MODE_LABELS: Record<NarrativeMode, string> = {
  linear: 'Linear', flashback: 'Flashback', 'flash-forward': 'Flash-Forward',
  parallel: 'Parallel', frame: 'Frame Story', simultaneous: 'Simultaneous',
  'time-skip': 'Time Skip', dream: 'Dream Sequence', mythic: 'Mythic', circular: 'Circular',
};
