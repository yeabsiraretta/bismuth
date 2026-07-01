import type { Command } from '@/stores/commands/commands';
import { showToast } from '@/stores/toast/toast';

export function buildRpgCommands(): Command[] {
  return [
    {
      id: 'rpg:new-campaign',
      name: 'RPG Manager: New Campaign',
      description: 'Create a new RPG campaign',
      category: 'RPG Manager',
      action: async () => {
        const name = prompt('Campaign name:');
        if (!name) return;
        const { createNewCampaign } = await import('@/features/rpg-manager');
        createNewCampaign(name);
        showToast(`Campaign "${name}" created`, 'success');
      },
    },
    {
      id: 'rpg:new-element',
      name: 'RPG Manager: New Element',
      description: 'Create a new campaign element (NPC, location, etc.)',
      category: 'RPG Manager',
      action: async () => {
        const { activeCampaignId } = await import('@/features/rpg-manager');
        const { get } = await import('svelte/store');
        if (!get(activeCampaignId)) {
          showToast('Select a campaign first', 'warning');
          return;
        }
        showToast('Use the RPG Manager panel to create elements', 'info');
      },
    },
    {
      id: 'rpg:new-npc',
      name: 'RPG Manager: New NPC',
      description: 'Create a new non-player character',
      category: 'RPG Manager',
      action: async () => {
        const { activeCampaignId, createNewElement } = await import('@/features/rpg-manager');
        const { get } = await import('svelte/store');
        if (!get(activeCampaignId)) {
          showToast('Select a campaign first', 'warning');
          return;
        }
        const name = prompt('NPC name:');
        if (!name) return;
        createNewElement('npc', name);
        showToast(`NPC "${name}" created`, 'success');
      },
    },
    {
      id: 'rpg:new-session',
      name: 'RPG Manager: New Session',
      description: 'Create a new session for the active campaign',
      category: 'RPG Manager',
      action: async () => {
        const { activeCampaignId, createNewElement } = await import('@/features/rpg-manager');
        const { get } = await import('svelte/store');
        if (!get(activeCampaignId)) {
          showToast('Select a campaign first', 'warning');
          return;
        }
        const name = prompt('Session name:');
        if (!name) return;
        createNewElement('session', name);
        showToast(`Session "${name}" created`, 'success');
      },
    },
    {
      id: 'rpg:new-location',
      name: 'RPG Manager: New Location',
      description: 'Create a new location',
      category: 'RPG Manager',
      action: async () => {
        const { activeCampaignId, createNewElement } = await import('@/features/rpg-manager');
        const { get } = await import('svelte/store');
        if (!get(activeCampaignId)) {
          showToast('Select a campaign first', 'warning');
          return;
        }
        const name = prompt('Location name:');
        if (!name) return;
        createNewElement('location', name);
        showToast(`Location "${name}" created`, 'success');
      },
    },
    {
      id: 'rpg:new-adventure',
      name: 'RPG Manager: New Adventure',
      description: 'Create a new adventure',
      category: 'RPG Manager',
      action: async () => {
        const { activeCampaignId, createNewElement } = await import('@/features/rpg-manager');
        const { get } = await import('svelte/store');
        if (!get(activeCampaignId)) {
          showToast('Select a campaign first', 'warning');
          return;
        }
        const name = prompt('Adventure name:');
        if (!name) return;
        createNewElement('adventure', name);
        showToast(`Adventure "${name}" created`, 'success');
      },
    },
  ];
}
