import type { Command } from '@/stores/commands/commands';
import type { DefaultCommandActions } from '@/stores/commands/defaultCommands';
import { buildCoreFeatureCommands } from './featuresCore';
import { buildMediaFeatureCommands } from './featuresMedia';
import { buildExtendedFeatureCommands } from './featuresExtended';
import { buildIntegrationFeatureCommands } from './featuresIntegration';
import { buildCreativeFeatureCommands } from './featuresCreative';
import { buildProductivityFeatureCommands } from './featuresProductivity';

export function buildFeatureCommands(actions: DefaultCommandActions): Command[] {
  return [
    ...buildCoreFeatureCommands(actions),
    ...buildMediaFeatureCommands(),
    ...buildExtendedFeatureCommands(),
    ...buildIntegrationFeatureCommands(),
    ...buildCreativeFeatureCommands(),
    ...buildProductivityFeatureCommands(),
  ];
}
