export type TabKind = 'note' | 'canvas' | 'pdf';

export interface EditorTab {
  id: string;
  path: string;
  title: string;
  dirty: boolean;
  ephemeral: boolean;
  groupId: string | null;
  kind: TabKind;
}

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  collapsed: boolean;
}

export interface ClosedTabEntry {
  path: string;
  title: string;
  groupId: string | null;
  closedAt: number;
}
