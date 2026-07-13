<script lang="ts">
  import './+page.css';
  import { goto } from '$app/navigation';
  import { pageTitle, SITE_URL } from '@/constants/seo';
  import { RECENT_VAULTS_KEY } from '@/constants/storage-keys';
  import BIcon from '@/ui/b-icon.svelte';
  import { VAULT_TEMPLATES } from '@/constants/vault-templates';
  import { setVault } from '@/hubs/core/stores/vault-store.svelte';
  import { APP_VERSION } from '@/constants/app-meta';
  import { openVault, createVault } from '@/sal/vault-service';
  import { log } from '@/utils/log/logger';
  import { MetaTags } from 'svelte-meta-tags';

  const welcomeLog = log.child('welcome');

  const ASCII_LOGO = `__________.__                       __  .__
\\______   \\__| ______ _____  __ ___/  |_|  |__
 |    |  _/  |/  ___//     \\|  |  \\   __\\  |  \\
 |    |   \\  |\\___ \\|  Y Y  \\  |  /|  | |   Y  \\
 |______  /__/____  >__|_|  /____/ |__| |___|  /
        \\/        \\/      \\/                 \\/`;

  type WelcomeView = 'landing' | 'home';
  let currentView = $state<WelcomeView>('landing');

  function advanceFromLanding() {
    if (currentView === 'landing') currentView = 'home';
  }

  interface RecentVault {
    name: string;
    path: string;
    openedAt: number;
  }
  let isCreating = $state(false);
  let errorMessage = $state('');
  let vaultName = $state('My Vault');
  let recentVaults = $state<RecentVault[]>([]);
  let selectedTemplate = $state<string | null>(null);

  try {
    const stored = localStorage.getItem(RECENT_VAULTS_KEY);
    if (stored) recentVaults = JSON.parse(stored);
  } catch {
    /* ignore */
  }

  function saveRecentVault(name: string, path: string) {
    const entry: RecentVault = { name, path, openedAt: Date.now() };
    recentVaults = [entry, ...recentVaults.filter((v) => v.path !== path)].slice(0, 5);
    try {
      localStorage.setItem(RECENT_VAULTS_KEY, JSON.stringify(recentVaults));
    } catch {
      /* */
    }
  }

  function isTauriAvailable(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }

  async function openFolderDialog(title: string): Promise<string | null> {
    if (!isTauriAvailable()) {
      return `/demo/${vaultName || 'My Vault'}`;
    }
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({ directory: true, multiple: false, title });
      if (!selected) return null;
      return Array.isArray(selected) ? selected[0] : selected;
    } catch {
      return `/demo/${vaultName || 'My Vault'}`;
    }
  }

  async function finishVaultOpen(vault: { name: string; rootPath: string }) {
    welcomeLog.info('finishVaultOpen', { name: vault.name, rootPath: vault.rootPath });
    setVault({ name: vault.name, rootPath: vault.rootPath });
    saveRecentVault(vault.name, vault.rootPath);
    welcomeLog.info('Navigating to / after vault open');
    await goto('/');
    welcomeLog.info('Navigation complete');
  }

  async function handleCreateBlankVault() {
    try {
      isCreating = true;
      errorMessage = '';
      welcomeLog.info('handleCreateBlankVault');
      const path = await openFolderDialog('Select Folder for New Vault');
      welcomeLog.info('Folder dialog returned', { path });
      if (path) await finishVaultOpen(await createVault(path, vaultName || 'My Vault'));
    } catch (e) {
      welcomeLog.error('Failed to create vault', e);
      errorMessage = `Failed to create vault: ${e}`;
    } finally {
      isCreating = false;
    }
  }

  async function handleCreateFromTemplate(templateId: string) {
    try {
      isCreating = true;
      errorMessage = '';
      const path = await openFolderDialog('Select Folder for New Vault');
      if (path) await finishVaultOpen(await createVault(path, templateId));
    } catch (e) {
      errorMessage = `Failed to create vault: ${e}`;
    } finally {
      isCreating = false;
    }
  }

  async function handleOpenExistingVault() {
    try {
      isCreating = true;
      errorMessage = '';
      welcomeLog.info('handleOpenExistingVault');
      const path = await openFolderDialog('Open Existing Vault');
      welcomeLog.info('Folder dialog returned', { path });
      if (path) await finishVaultOpen(await openVault(path));
    } catch (e) {
      welcomeLog.error('Failed to open vault', e);
      errorMessage = `Failed to open vault: ${e}`;
    } finally {
      isCreating = false;
    }
  }

  async function handleOpenRecent(rv: RecentVault) {
    try {
      isCreating = true;
      errorMessage = '';
      welcomeLog.info('handleOpenRecent', { name: rv.name, path: rv.path });
      await finishVaultOpen(await openVault(rv.path));
    } catch (e) {
      welcomeLog.error('Could not reopen vault', e);
      errorMessage = `Could not reopen vault: ${e}`;
    } finally {
      isCreating = false;
    }
  }

  function removeRecent(path: string) {
    recentVaults = recentVaults.filter((v) => v.path !== path);
    try {
      localStorage.setItem(RECENT_VAULTS_KEY, JSON.stringify(recentVaults));
    } catch {
      /* */
    }
  }

  function timeAgo(ms: number): string {
    const s = Math.floor((Date.now() - ms) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }
</script>

<MetaTags
  title={pageTitle('Welcome')}
  description="Get started with Bismuth — open or create your first vault."
  canonical="{SITE_URL}/welcome"
  openGraph={{
    url: `${SITE_URL}/welcome`,
    title: pageTitle('Welcome'),
    description: 'Get started with Bismuth.',
  }}
/>

<svelte:window onkeydown={advanceFromLanding} />

{#if currentView === 'landing'}
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
  <div class="sv-landing" onclick={advanceFromLanding}>
    <pre class="sv-ascii" aria-label="Bismuth">{ASCII_LOGO}</pre>
    <p class="sv-press-key">press any key to continue</p>
    <footer class="sv-footer">
      <span>v{APP_VERSION}</span>
    </footer>
  </div>
{:else}
  <div class="sv-setup">
    <header class="sv-header">
      <pre class="sv-ascii sv-ascii-small" aria-label="Bismuth">{ASCII_LOGO}</pre>
      <p class="sv-subtitle">Pick a template to get started, or open an existing vault</p>
    </header>

    {#if errorMessage}
      <div class="sv-error" role="alert">{errorMessage}</div>
    {/if}

    <div class="sv-actions">
      <label class="sv-input-wrap">
        <span class="sv-input-label">Vault name</span>
        <input class="sv-input" type="text" placeholder="My Vault" bind:value={vaultName} />
      </label>
      <button
        class="sv-btn sv-btn-outline"
        onclick={handleCreateBlankVault}
        disabled={isCreating}
        aria-label="Create blank vault"
      >
        <BIcon name="plus" size={16} class="sv-btn-icon" />
        Blank Vault
      </button>
      <button
        class="sv-btn sv-btn-outline"
        onclick={handleOpenExistingVault}
        disabled={isCreating}
        aria-label="Open existing vault folder"
      >
        <BIcon name="folderOpen" size={16} class="sv-btn-icon" />
        Open Existing
      </button>
    </div>

    {#if recentVaults.length > 0}
      <section class="sv-section" aria-label="Recent vaults">
        <h2 class="sv-section-title">Recent Vaults</h2>
        <div class="sv-recent-list">
          {#each recentVaults as rv (rv.path)}
            <button
              class="sv-recent-item"
              onclick={() => handleOpenRecent(rv)}
              disabled={isCreating}
            >
              <div class="sv-recent-info">
                <span class="sv-recent-name">{rv.name}</span>
                <span class="sv-recent-path">{rv.path}</span>
              </div>
              <div class="sv-recent-meta">
                <span class="sv-recent-time">{timeAgo(rv.openedAt)}</span>
                <span
                  class="sv-recent-remove"
                  role="button"
                  tabindex="0"
                  onclick={(e) => {
                    e.stopPropagation();
                    removeRecent(rv.path);
                  }}
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      removeRecent(rv.path);
                    }
                  }}
                  aria-label="Remove {rv.name} from recent">×</span
                >
              </div>
            </button>
          {/each}
        </div>
      </section>
    {/if}

    <section class="sv-section" aria-label="Templates">
      <h2 class="sv-section-title">Templates</h2>
      <div class="sv-grid">
        {#each VAULT_TEMPLATES as tmpl (tmpl.id)}
          <div
            class="sv-card"
            class:sv-card-selected={selectedTemplate === tmpl.id}
            role="button"
            tabindex="0"
            aria-pressed={selectedTemplate === tmpl.id}
            onclick={() => (selectedTemplate = selectedTemplate === tmpl.id ? null : tmpl.id)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectedTemplate = selectedTemplate === tmpl.id ? null : tmpl.id;
              }
            }}
          >
            <div class="sv-card-head">
              <BIcon name={tmpl.icon} size={20} class="sv-card-icon" />
              <h3 class="sv-card-title">{tmpl.title}</h3>
            </div>
            <p class="sv-card-desc">{tmpl.description}</p>
            <div class="sv-card-folders">
              {#each tmpl.folders as folder (folder)}
                <span class="sv-folder">{folder}</span>
              {/each}
            </div>
            {#if selectedTemplate === tmpl.id}
              <button
                class="sv-btn sv-btn-primary sv-card-create"
                onclick={(e) => {
                  e.stopPropagation();
                  handleCreateFromTemplate(tmpl.id);
                }}
                disabled={isCreating}
              >
                {isCreating ? 'Creating…' : 'Create Vault'}
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </section>

    <footer class="sv-footer">
      <span>Bismuth v{APP_VERSION}</span>
      <span aria-hidden="true">&middot;</span>
      <span>Local-first &middot; Markdown &middot; Privacy-first</span>
    </footer>
  </div>
{/if}
