import type { Command } from '@/stores/commands/commands';
import type { DefaultCommandActions } from '@/stores/commands/defaultCommands';

export function buildVaultCommands(actions: DefaultCommandActions): Command[] {
  return [
    {
      id: 'vault:insert-template',
      name: 'Insert Template',
      description: 'Insert a template into the current note',
      category: 'Vault',
      action: actions.insertTemplate ?? (() => {}),
    },
    {
      id: 'vault:new-template',
      name: 'New Template',
      description: 'Create a new template',
      category: 'Vault',
      action: actions.newTemplate ?? (() => {}),
    },
  ];
}
