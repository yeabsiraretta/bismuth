<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { pendingReward, acceptPendingReward, skipPendingReward, rewarderConfig } from '../stores/rewarderStore';

  $: reward = $pendingReward;
  $: quoteMode = $rewarderConfig.quoteMode;

  function handleAccept() {
    acceptPendingReward();
  }

  function handleSkip() {
    skipPendingReward();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!reward) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAccept(); }
    if (e.key === 'Escape') handleSkip();
  }
</script>

{#if reward}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="rewarder-overlay" on:click={handleSkip} role="presentation">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="rewarder-modal"
      class:legendary={reward.occurrence === 'legendary'}
      class:rare={reward.occurrence === 'rare'}
      on:click|stopPropagation={() => {}}
      on:keydown={handleKeydown}
      role="dialog"
      aria-modal="true"
      aria-label={quoteMode ? 'Quote' : 'Reward earned'}
      tabindex="-1"
    >
      {#if !quoteMode}
        <div class="reward-header">
          <Icon name="gift" size={20} />
          <span class="reward-title">
            {#if reward.occurrence === 'legendary'}
              🌟 Legendary Reward!
            {:else if reward.occurrence === 'rare'}
              ✨ Rare Reward!
            {:else}
              🎉 Reward!
            {/if}
          </span>
        </div>
      {/if}

      {#if reward.imageUrl}
        <div class="reward-image">
          <img src={reward.imageUrl} alt={reward.name} />
        </div>
      {/if}

      <div class="reward-name">{reward.name}</div>

      {#if reward.taskText && !quoteMode}
        <div class="reward-task">
          For completing: <em>{reward.taskText}</em>
        </div>
      {/if}

      <div class="reward-badge">{reward.occurrence}</div>

      <div class="reward-actions">
        <button class="btn-accept" on:click={handleAccept}>
          <Icon name="check" size={14} />
          {quoteMode ? 'Close' : 'Claim reward'}
        </button>
        <button class="btn-skip" on:click={handleSkip}>
          Skip this reward
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .rewarder-overlay {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease-out;
  }
  .rewarder-modal {
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-l, 12px);
    padding: 24px; max-width: 360px; width: 90%;
    text-align: center;
    animation: scaleIn 0.25s ease-out;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  .rewarder-modal.legendary {
    border-color: var(--status-warning);
    box-shadow: 0 0 30px color-mix(in srgb, var(--status-warning) 20%, transparent),
                0 20px 60px rgba(0, 0, 0, 0.3);
  }
  .rewarder-modal.rare {
    border-color: var(--interactive-accent);
    box-shadow: 0 0 20px color-mix(in srgb, var(--interactive-accent) 15%, transparent),
                0 20px 60px rgba(0, 0, 0, 0.3);
  }
  .reward-header {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    margin-bottom: 16px; color: var(--interactive-accent);
  }
  .reward-title { font-size: 16px; font-weight: 700; }
  .reward-image {
    margin: 12px auto; max-width: 200px; max-height: 200px;
    border-radius: var(--radius-m, 8px); overflow: hidden;
  }
  .reward-image img {
    width: 100%; height: auto; object-fit: cover; display: block;
  }
  .reward-name {
    font-size: 18px; font-weight: 600; color: var(--text-normal);
    margin: 12px 0 8px;
  }
  .reward-task {
    font-size: 12px; color: var(--text-muted); margin-bottom: 8px;
  }
  .reward-badge {
    display: inline-block; padding: 2px 10px; border-radius: 12px;
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    background: color-mix(in srgb, var(--interactive-accent) 12%, transparent);
    color: var(--interactive-accent); margin-bottom: 16px;
  }
  .reward-actions { display: flex; flex-direction: column; gap: 8px; }
  .btn-accept {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    width: 100%; padding: 10px; border: none;
    border-radius: var(--radius-m, 8px);
    background: var(--interactive-accent); color: var(--text-on-accent);
    font-size: 14px; font-weight: 600; cursor: pointer;
    transition: opacity var(--transition-fast);
  }
  .btn-accept:hover { opacity: 0.9; }
  .btn-skip {
    background: none; border: none; padding: 6px;
    color: var(--text-muted); font-size: 12px; cursor: pointer;
  }
  .btn-skip:hover { color: var(--text-normal); text-decoration: underline; }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
