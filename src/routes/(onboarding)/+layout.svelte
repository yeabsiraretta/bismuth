<script lang="ts">
  let { children } = $props();
</script>

<div class="onboarding-shell">
  <div class="onboarding-content">
    {@render children()}
  </div>
</div>

<style>
  .onboarding-shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  .onboarding-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-background);
    background-image: radial-gradient(
      ellipse at 50% 0%,
      oklch(from var(--color-accent) l c h / 0.04) 0%,
      transparent 60%
    );
    animation: fade-in 0.4s ease-out;
  }
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
