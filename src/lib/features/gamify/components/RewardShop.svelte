<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { gamifyCoins, gamifyRewards, purchaseReward, resetReward } from '../stores/gamifyStore';

  $: available = $gamifyRewards.filter((r) => !r.purchased);
  $: purchased = $gamifyRewards.filter((r) => r.purchased);
</script>

<div class="reward-shop">
  <div class="balance">
    <Icon name="coins" size={16} />
    <span class="balance-amount">{$gamifyCoins} coins</span>
  </div>

  {#if available.length > 0}
    <div class="reward-section">
      <span class="section-label">Available</span>
      {#each available as reward}
        <div class="reward-item">
          <span class="reward-icon">{reward.icon}</span>
          <div class="reward-info">
            <span class="reward-name">{reward.name}</span>
            <span class="reward-desc">{reward.description}</span>
          </div>
          <button
            class="buy-btn"
            disabled={$gamifyCoins < reward.cost}
            on:click={() => purchaseReward(reward.id)}
            title="Purchase for {reward.cost} coins"
          >
            {reward.cost}
          </button>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty">
      <p>No rewards available</p>
      <p class="hint">Add rewards in gamification settings</p>
    </div>
  {/if}

  {#if purchased.length > 0}
    <div class="reward-section">
      <span class="section-label">Purchased</span>
      {#each purchased as reward}
        <div class="reward-item purchased">
          <span class="reward-icon">{reward.icon}</span>
          <div class="reward-info">
            <span class="reward-name">{reward.name}</span>
          </div>
          <button class="reset-btn" on:click={() => resetReward(reward.id)} title="Reset">
            <Icon name="refresh-cw" size={10} />
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .reward-shop {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .balance {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px;
    background: var(--panel-bg-alt, #181825);
    border-radius: 6px;
  }
  .balance-amount {
    font-size: 14px;
    font-weight: 700;
    color: var(--warning-color, #f59e0b);
  }
  .reward-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .section-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    padding: 4px 0;
  }
  .reward-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid var(--border-color);
  }
  .reward-item.purchased {
    opacity: 0.7;
  }
  .reward-icon {
    font-size: 18px;
  }
  .reward-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .reward-name {
    font-size: 12px;
    font-weight: 500;
  }
  .reward-desc {
    font-size: 10px;
    color: var(--text-muted);
  }
  .buy-btn {
    padding: 4px 10px;
    border: none;
    border-radius: 4px;
    background: var(--warning-color, #f59e0b);
    color: white;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
  }
  .buy-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .reset-btn {
    background: none;
    border: none;
    padding: 4px;
    border-radius: 4px;
    cursor: pointer;
    color: var(--text-muted);
  }
  .reset-btn:hover {
    background: var(--hover-bg);
  }
  .empty {
    text-align: center;
    padding: 16px;
    color: var(--text-muted);
  }
  .empty p {
    margin: 4px 0;
    font-size: 12px;
  }
  .hint {
    font-size: 11px;
    opacity: 0.7;
  }
</style>
