import type { Command } from './commands';
import { buildNavigationCommands } from './builders/navigation';
import { buildFeatureCommands } from './builders/features';
import { buildVaultCommands } from './builders/vault';
import { buildViewCommands } from './builders/views';
import { buildEditorCommands } from './builders/editor';
import { buildRpgCommands } from './builders/rpg';
import { buildSmartGraphCommands } from './builders/smartGraph';
import { buildProjectCommands } from './builders/projects';
import { buildLifeTrackerCommands } from './builders/lifetracker';
import { buildMarginaliaCommands } from './builders/marginalia';
import { buildBacklinkCacheCommands } from './builders/backlinkCache';
import { buildAiCommands } from './builders/ai';

export interface DefaultCommandActions {
  newNote?: () => void;
  openSearch?: () => void;
  openCommandPalette?: () => void;
  openSettings?: () => void;
  toggleLeftSidebar?: () => void;
  toggleRightSidebar?: () => void;
  quickCapture?: () => void;
  openGraph?: () => void;
  openCaptureDashboard?: () => void;
  openAutoLinker?: () => void;
  publishSite?: () => void;
  insertTemplate?: () => void;
  newTemplate?: () => void;
  openQuest?: () => void;
}

export function buildDefaultCommands(actions: DefaultCommandActions): Command[] {
  return [
    ...buildVaultCommands(actions),
    ...buildNavigationCommands(actions),
    ...buildFeatureCommands(actions),
    ...buildViewCommands(),
    ...buildEditorCommands(),
    ...buildRpgCommands(),
    ...buildSmartGraphCommands(),
    ...buildProjectCommands(),
    ...buildLifeTrackerCommands(),
    ...buildMarginaliaCommands(),
    ...buildBacklinkCacheCommands(),
    ...buildAiCommands(),
  ];
}
