<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { activeCampaign, storyCampaigns, activeSessions, activeSessionLog, createNewCampaign, selectCampaign, removeCampaign, addPartyMember, updateMemberHp, toggleMemberActive, addMemberCondition, removeMemberCondition, addItem, removeItem, assignOwner, addLog, setActiveScene, addSession } from '../stores/campaignStore';
  import type { Condition } from '../types/campaign';

  let newCampaignName = '';
  let showCreate = false;
  let memberName = '';
  let memberHp = 20;
  let itemName = '';
  let logText = '';
  let tab: 'party' | 'inventory' | 'log' | 'scenes' = 'party';

  const CONDITIONS: Condition[] = ['blinded', 'charmed', 'deafened', 'frightened', 'grappled', 'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained', 'stunned', 'unconscious', 'exhaustion'];

  function handleCreate() {
    if (!newCampaignName.trim()) return;
    createNewCampaign(newCampaignName.trim());
    newCampaignName = ''; showCreate = false;
  }
</script>

<div class="cp-panel">
  <div class="cp-header">
    <h3>Campaign</h3>
    <div class="cp-header-actions">
      {#if $storyCampaigns.length > 0}
        <select class="cp-select" value={$activeCampaign?.id ?? ''} on:change={(e) => selectCampaign(e.currentTarget.value || null)}>
          <option value="">Select campaign…</option>
          {#each $storyCampaigns as c}
            <option value={c.id}>{c.name}</option>
          {/each}
        </select>
      {/if}
      <button class="cp-btn-icon" on:click={() => { showCreate = !showCreate; }} title="New campaign">
        <Icon name="plus" size={14} />
      </button>
    </div>
  </div>

  {#if showCreate}
    <div class="cp-create">
      <input bind:value={newCampaignName} placeholder="Campaign name…" class="cp-input" on:keydown={(e) => e.key === 'Enter' && handleCreate()} />
      <button class="cp-btn-primary" on:click={handleCreate}>Create</button>
    </div>
  {/if}

  {#if $activeCampaign}
    <div class="cp-tabs">
      <button class="cp-tab" class:active={tab === 'party'} on:click={() => { tab = 'party'; }}>
        <Icon name="users" size={13} /> Party
      </button>
      <button class="cp-tab" class:active={tab === 'inventory'} on:click={() => { tab = 'inventory'; }}>
        <Icon name="box" size={13} /> Inventory
      </button>
      <button class="cp-tab" class:active={tab === 'log'} on:click={() => { tab = 'log'; }}>
        <Icon name="file-text" size={13} /> Log
      </button>
      <button class="cp-tab" class:active={tab === 'scenes'} on:click={() => { tab = 'scenes'; }}>
        <Icon name="film" size={13} /> Scenes
      </button>
    </div>

    <div class="cp-content">
      {#if tab === 'party'}
        <div class="cp-section">
          <div class="cp-add-row">
            <input class="cp-input" bind:value={memberName} placeholder="Character name…" />
            <input class="cp-input cp-hp-input" type="number" bind:value={memberHp} min={1} />
            <button class="cp-btn-primary" on:click={() => { if (memberName.trim()) { addPartyMember('', memberName.trim(), memberHp); memberName = ''; } }}>Add</button>
          </div>
          {#each $activeCampaign.party as member (member.id)}
            <div class="cp-member" class:inactive={!member.isActive}>
              <div class="cp-member-header">
                <button class="cp-toggle" on:click={() => toggleMemberActive(member.id)} title={member.isActive ? 'Deactivate' : 'Activate'}>
                  <Icon name={member.isActive ? 'eye' : 'eye-off'} size={13} />
                </button>
                <span class="cp-member-name">{member.name}</span>
                <div class="cp-hp">
                  <button class="cp-hp-btn" on:click={() => updateMemberHp(member.id, member.hp - 1)}>−</button>
                  <span class="cp-hp-val" class:low={member.hp <= member.maxHp * 0.25}>{member.hp}/{member.maxHp}</span>
                  <button class="cp-hp-btn" on:click={() => updateMemberHp(member.id, member.hp + 1)}>+</button>
                </div>
              </div>
              {#if member.conditions.length > 0}
                <div class="cp-conditions">
                  {#each member.conditions as cond}
                    <button class="cp-condition-tag" on:click={() => removeMemberCondition(member.id, cond)}>{cond} ×</button>
                  {/each}
                </div>
              {/if}
              <div class="cp-condition-add">
                <select class="cp-select-sm" on:change={(e) => { if (e.currentTarget.value) { addMemberCondition(member.id, e.currentTarget.value); e.currentTarget.value = ''; } }}>
                  <option value="">+ Condition</option>
                  {#each CONDITIONS.filter(c => !member.conditions.includes(c)) as c}
                    <option value={c}>{c}</option>
                  {/each}
                </select>
              </div>
            </div>
          {/each}
        </div>

      {:else if tab === 'inventory'}
        <div class="cp-section">
          <div class="cp-add-row">
            <input class="cp-input" bind:value={itemName} placeholder="Item name…" on:keydown={(e) => e.key === 'Enter' && (() => { if (itemName.trim()) { addItem(itemName.trim()); itemName = ''; } })()} />
            <button class="cp-btn-primary" on:click={() => { if (itemName.trim()) { addItem(itemName.trim()); itemName = ''; } }}>Add</button>
          </div>
          {#each $activeCampaign.sharedInventory as item (item.id)}
            <div class="cp-item">
              <span class="cp-item-name">{item.name}</span>
              <span class="cp-item-qty">×{item.quantity}</span>
              {#if item.ownerId}
                <span class="cp-item-owner">({$activeCampaign.party.find(m => m.id === item.ownerId)?.name ?? 'Unknown'})</span>
              {/if}
              <select class="cp-select-sm" value={item.ownerId ?? ''} on:change={(e) => assignOwner(item.id, e.currentTarget.value || null)}>
                <option value="">Shared</option>
                {#each $activeCampaign.party as m}
                  <option value={m.id}>{m.name}</option>
                {/each}
              </select>
              <button class="cp-btn-delete" on:click={() => removeItem(item.id)}>
                <Icon name="x" size={12} />
              </button>
            </div>
          {/each}
          {#if $activeCampaign.sharedInventory.length === 0}
            <div class="cp-empty">No items. Add items to the shared inventory above.</div>
          {/if}
        </div>

      {:else if tab === 'log'}
        <div class="cp-section">
          <div class="cp-add-row">
            <input class="cp-input" bind:value={logText} placeholder="Log entry…" on:keydown={(e) => e.key === 'Enter' && (() => { if (logText.trim()) { addLog('narrative', logText.trim()); logText = ''; } })()} />
            <button class="cp-btn-primary" on:click={() => { if (logText.trim()) { addLog('narrative', logText.trim()); logText = ''; } }}>Add</button>
          </div>
          <div class="cp-log-list">
            {#each $activeSessionLog as entry (entry.id)}
              <div class="cp-log-entry">
                <span class="cp-log-time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span class="cp-log-type">[{entry.type}]</span>
                <span class="cp-log-text">{entry.text}</span>
              </div>
            {/each}
          </div>
        </div>

      {:else if tab === 'scenes'}
        <div class="cp-section">
          <div class="cp-empty">
            <Icon name="film" size={24} />
            <p>Scene graph and branching navigation. Link scenes from the Entity panel to use them here.</p>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="cp-empty-state">
      <Icon name="shield" size={32} />
      <p>Select or create a campaign to begin.</p>
    </div>
  {/if}
</div>

<style>
  .cp-panel { display: flex; flex-direction: column; height: 100%; }
  .cp-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid var(--background-modifier-border, #333); }
  .cp-header h3 { margin: 0; font-size: 14px; }
  .cp-header-actions { display: flex; gap: 6px; align-items: center; }
  .cp-create { display: flex; gap: 6px; padding: 8px 14px; border-bottom: 1px solid var(--background-modifier-border, #333); }
  .cp-tabs { display: flex; border-bottom: 1px solid var(--background-modifier-border, #333); }
  .cp-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 8px; border: none; background: none; color: var(--text-muted); cursor: pointer; font-size: 12px; border-bottom: 2px solid transparent; }
  .cp-tab:hover { color: var(--text-normal); }
  .cp-tab.active { color: var(--text-normal); border-bottom-color: var(--interactive-accent, #7c3aed); }
  .cp-content { flex: 1; overflow-y: auto; }
  .cp-section { padding: 8px 14px; }
  .cp-add-row { display: flex; gap: 6px; margin-bottom: 10px; }
  .cp-input { flex: 1; padding: 5px 8px; border: 1px solid var(--background-modifier-border, #444); border-radius: 4px; background: var(--background-primary); color: var(--text-normal); font-size: 12px; }
  .cp-hp-input { width: 50px; flex: none; }
  .cp-select { padding: 4px 6px; border: 1px solid var(--background-modifier-border, #444); border-radius: 4px; background: var(--background-primary); color: var(--text-normal); font-size: 11px; }
  .cp-select-sm { padding: 2px 4px; border: 1px solid var(--background-modifier-border, #444); border-radius: 3px; background: var(--background-primary); color: var(--text-normal); font-size: 10px; }
  .cp-btn-primary { padding: 5px 10px; border: none; border-radius: 4px; background: var(--interactive-accent, #7c3aed); color: #fff; cursor: pointer; font-size: 12px; white-space: nowrap; }
  .cp-btn-icon { border: none; background: none; color: var(--text-normal); cursor: pointer; padding: 4px; }
  .cp-btn-delete { border: none; background: none; color: var(--text-muted); cursor: pointer; padding: 2px; }
  .cp-btn-delete:hover { color: var(--text-error, #f87171); }
  .cp-member { padding: 8px; margin-bottom: 6px; border: 1px solid var(--background-modifier-border, #333); border-radius: 6px; }
  .cp-member.inactive { opacity: 0.5; }
  .cp-member-header { display: flex; align-items: center; gap: 8px; }
  .cp-toggle { border: none; background: none; color: var(--text-muted); cursor: pointer; padding: 2px; }
  .cp-member-name { flex: 1; font-weight: 500; }
  .cp-hp { display: flex; align-items: center; gap: 4px; }
  .cp-hp-btn { width: 20px; height: 20px; border: 1px solid var(--background-modifier-border, #444); border-radius: 3px; background: none; color: var(--text-normal); cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }
  .cp-hp-val { font-size: 12px; font-weight: 600; min-width: 40px; text-align: center; }
  .cp-hp-val.low { color: var(--text-error, #f87171); }
  .cp-conditions { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
  .cp-condition-tag { padding: 2px 6px; border: none; border-radius: 10px; background: rgba(124,58,237,0.2); color: var(--text-normal); cursor: pointer; font-size: 10px; }
  .cp-condition-tag:hover { background: rgba(239,68,68,0.3); }
  .cp-condition-add { margin-top: 4px; }
  .cp-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--background-modifier-border, #2a2a2a); }
  .cp-item-name { flex: 1; font-size: 13px; }
  .cp-item-qty { font-size: 11px; opacity: 0.6; }
  .cp-item-owner { font-size: 10px; opacity: 0.5; }
  .cp-log-list { max-height: 300px; overflow-y: auto; }
  .cp-log-entry { display: flex; gap: 6px; padding: 4px 0; font-size: 12px; border-bottom: 1px solid var(--background-modifier-border, #2a2a2a); }
  .cp-log-time { color: var(--text-muted); font-size: 10px; min-width: 60px; }
  .cp-log-type { color: var(--interactive-accent); font-size: 10px; }
  .cp-log-text { flex: 1; }
  .cp-empty, .cp-empty-state { text-align: center; padding: 24px; opacity: 0.5; font-size: 12px; }
  .cp-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 8px; }
</style>
