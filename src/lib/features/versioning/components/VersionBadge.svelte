<script lang="ts">
  /**
   * VersionBadge — compact pill showing version and bump type color coding.
   *
   * Props:
   *   version  — semver string, e.g. "1.2.3"
   *   bumpType — 'patch' | 'minor' | 'major'
   */
  import type { BumpType } from '../types/versioning';

  export let version: string;
  export let bumpType: BumpType = 'patch';

  $: colorClass = bumpType === 'major'
    ? 'badge-major'
    : bumpType === 'minor'
    ? 'badge-minor'
    : 'badge-patch';
</script>

<span
  class="version-badge {colorClass}"
  title={version}
  aria-label="Version {version}, {bumpType} change"
>
  v{version}
</span>

<style>
  .version-badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 10px;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
    line-height: 1.5;
  }

  .badge-patch {
    background: var(--color-neutral-muted, rgba(107, 114, 128, 0.15));
    color: var(--color-neutral, #6b7280);
  }

  .badge-minor {
    background: var(--color-info-muted, rgba(59, 130, 246, 0.15));
    color: var(--color-info, #3b82f6);
  }

  .badge-major {
    background: var(--color-warning-muted, rgba(245, 158, 11, 0.15));
    color: var(--color-warning, #f59e0b);
  }
</style>
