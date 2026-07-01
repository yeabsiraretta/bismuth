/**
 * Storyteller Suite — Campaign play and D&D session types.
 */

export interface Campaign {
  id: string;
  storyId: string;
  name: string;
  sessionsFolder: string;
  activeSessionId: string | null;
  activeSceneId: string | null;
  party: PartyMember[];
  sharedInventory: InventoryItem[];
  logEntries: SessionLogEntry[];
}

export interface PartyMember {
  id: string;
  entityId: string;
  name: string;
  hp: number;
  maxHp: number;
  conditions: Condition[];
  isActive: boolean;
}

export type Condition =
  | 'blinded' | 'charmed' | 'deafened' | 'frightened'
  | 'grappled' | 'incapacitated' | 'invisible' | 'paralyzed'
  | 'petrified' | 'poisoned' | 'prone' | 'restrained'
  | 'stunned' | 'unconscious' | 'exhaustion'
  | string; // allow custom conditions

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  ownerId: string | null;
  description?: string;
  useEffect?: string;
  tags: string[];
}

export interface SessionNote {
  id: string;
  campaignId: string;
  sessionNumber: number;
  title: string;
  notePath: string;
  date: string;
  summary?: string;
}

export interface SessionLogEntry {
  id: string;
  sessionId: string;
  timestamp: string;
  type: 'narrative' | 'combat' | 'lore' | 'note' | 'scene-change';
  text: string;
  sceneId?: string;
}

export interface SceneGraphNode {
  sceneId: string;
  label: string;
  x: number;
  y: number;
}

export interface SceneGraphEdge {
  fromSceneId: string;
  toSceneId: string;
  label: string;
  branchId?: string;
}

export interface LoreSurface {
  entityId: string;
  entityName: string;
  entityType: string;
  relevance: 'location' | 'inventory' | 'character' | 'tag';
  snippet: string;
}
