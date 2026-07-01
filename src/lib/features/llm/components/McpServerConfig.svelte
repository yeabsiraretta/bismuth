<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    mcpServers,
    addMcpServer,
    removeMcpServer,
    connectMcpServer,
    disconnectMcpServer,
    updateMcpServer,
  } from '../services/mcpClient';
  import type { McpTransport } from '../types/llm';

  let showAddForm = false;
  let newName = '';
  let newTransport: McpTransport = 'stdio';
  let newCommand = '';
  let newArgs = '';

  function handleAdd() {
    if (!newName.trim() || !newCommand.trim()) return;
    addMcpServer({
      name: newName.trim(),
      transport: newTransport,
      command: newCommand.trim(),
      args: newArgs ? newArgs.split(' ').filter(Boolean) : [],
      env: {},
      enabled: true,
    });
    newName = '';
    newCommand = '';
    newArgs = '';
    showAddForm = false;
  }

  function handleToggle(id: string, enabled: boolean) {
    updateMcpServer(id, { enabled: !enabled });
    if (enabled) disconnectMcpServer(id);
  }

  const statusIcons: Record<string, string> = {
    disconnected: 'circle',
    connecting: 'loader',
    connected: 'check-circle',
    error: 'alert-circle',
  };
  const statusColors: Record<string, string> = {
    disconnected: 'var(--text-faint)',
    connecting: 'var(--text-warning, #f59e0b)',
    connected: 'var(--text-success, #22c55e)',
    error: 'var(--text-error)',
  };
</script>

<div class="mcp-config">
  <div class="section-header">
    <h4 class="section-title">MCP Servers</h4>
    <button
      class="add-btn"
      on:click={() => (showAddForm = !showAddForm)}
      aria-label="Add MCP server"
      title="Add server"
    >
      <Icon name="plus" size={14} />
    </button>
  </div>

  {#if showAddForm}
    <div class="add-form">
      <div class="form-row">
        <label class="form-label" for="mcp-name">Name</label>
        <input id="mcp-name" class="form-input" type="text" bind:value={newName} placeholder="My Server" />
      </div>
      <div class="form-row">
        <label class="form-label" for="mcp-transport">Transport</label>
        <select id="mcp-transport" class="form-input" bind:value={newTransport}>
          <option value="stdio">stdio</option>
          <option value="sse">SSE</option>
          <option value="http">HTTP</option>
        </select>
      </div>
      <div class="form-row">
        <label class="form-label" for="mcp-command">
          {newTransport === 'stdio' ? 'Command' : 'URL'}
        </label>
        <input
          id="mcp-command"
          class="form-input"
          type="text"
          bind:value={newCommand}
          placeholder={newTransport === 'stdio' ? 'npx -y @modelcontextprotocol/server' : 'http://localhost:3000'}
        />
      </div>
      {#if newTransport === 'stdio'}
        <div class="form-row">
          <label class="form-label" for="mcp-args">Arguments</label>
          <input id="mcp-args" class="form-input" type="text" bind:value={newArgs} placeholder="arg1 arg2" />
        </div>
      {/if}
      <div class="form-actions">
        <button class="btn btn--primary" on:click={handleAdd} disabled={!newName.trim() || !newCommand.trim()}>
          Add Server
        </button>
        <button class="btn btn--secondary" on:click={() => (showAddForm = false)}>Cancel</button>
      </div>
    </div>
  {/if}

  {#if $mcpServers.length === 0}
    <p class="empty-hint">No MCP servers configured. Add one to extend agent capabilities.</p>
  {:else}
    <div class="server-list">
      {#each $mcpServers as server (server.id)}
        <div class="server-card">
          <div class="server-header">
            <span class="server-status" style="color: {statusColors[server.status ?? 'disconnected']}" title={server.status ?? 'disconnected'}>
              <Icon name={statusIcons[server.status ?? 'disconnected']} size={14} />
            </span>
            <span class="server-name">{server.name}</span>
            <span class="server-transport">{server.transport}</span>
          </div>

          <div class="server-command" title={server.command}>{server.command}</div>

          {#if server.error}
            <div class="server-error">{server.error}</div>
          {/if}

          {#if server.tools && server.tools.length > 0}
            <div class="server-tools">
              {server.tools.length} tool{server.tools.length !== 1 ? 's' : ''}: {server.tools.map(t => t.name).join(', ')}
            </div>
          {/if}

          <div class="server-actions">
            <button
              class="action-btn"
              on:click={() => handleToggle(server.id, server.enabled)}
              aria-label={server.enabled ? 'Disable' : 'Enable'}
            >
              {server.enabled ? 'Disable' : 'Enable'}
            </button>
            {#if server.enabled && server.status !== 'connected'}
              <button class="action-btn" on:click={() => connectMcpServer(server.id)} aria-label="Connect">
                Connect
              </button>
            {/if}
            {#if server.status === 'connected'}
              <button class="action-btn" on:click={() => disconnectMcpServer(server.id)} aria-label="Disconnect">
                Disconnect
              </button>
            {/if}
            <button class="action-btn action-btn--danger" on:click={() => removeMcpServer(server.id)} aria-label="Remove server">
              <Icon name="trash" size={12} />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .mcp-config { display: flex; flex-direction: column; gap: var(--spacing-m); }

  .section-header { display: flex; align-items: center; justify-content: space-between; }
  .section-title {
    margin: 0;
    font-size: var(--font-ui-small, 13px);
    font-weight: var(--font-semibold, 600);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .add-btn {
    display: flex; align-items: center; justify-content: center;
    width: 24px; height: 24px; padding: 0; border: none;
    background: transparent; border-radius: var(--radius-s);
    color: var(--text-muted); cursor: pointer;
  }
  .add-btn:hover { background: var(--background-modifier-hover); color: var(--text-normal); }

  .add-form {
    display: flex; flex-direction: column; gap: var(--spacing-s);
    padding: var(--spacing-m);
    background: var(--background-secondary);
    border-radius: var(--radius-m, 8px);
    border: 1px solid var(--background-modifier-border);
  }
  .form-row { display: flex; flex-direction: column; gap: 4px; }
  .form-label { font-size: var(--font-ui-smaller, 12px); font-weight: var(--font-medium, 500); color: var(--text-muted); }
  .form-input {
    padding: 6px 10px;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-small, 13px);
  }
  .form-input:focus { border-color: var(--interactive-accent); outline: none; }
  .form-actions { display: flex; gap: var(--spacing-s); margin-top: var(--spacing-xs); }
  .btn {
    padding: 6px 12px; border: none; border-radius: var(--radius-s);
    font-size: var(--font-ui-small, 13px); font-weight: var(--font-medium, 500); cursor: pointer;
  }
  .btn--primary { background: var(--interactive-accent); color: var(--text-on-accent, #fff); }
  .btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn--secondary { background: var(--background-modifier-border); color: var(--text-normal); }

  .empty-hint { margin: 0; font-size: var(--font-ui-small, 13px); color: var(--text-faint); }

  .server-list { display: flex; flex-direction: column; gap: var(--spacing-s); }
  .server-card {
    display: flex; flex-direction: column; gap: var(--spacing-xs);
    padding: var(--spacing-s);
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 8px);
  }
  .server-header { display: flex; align-items: center; gap: var(--spacing-xs); }
  .server-name { font-size: var(--font-ui-small, 13px); font-weight: var(--font-medium, 500); color: var(--text-normal); flex: 1; }
  .server-transport { font-size: var(--font-ui-smaller, 12px); color: var(--text-faint); text-transform: uppercase; }
  .server-status { display: flex; align-items: center; }
  .server-command {
    font-size: var(--font-ui-smaller, 12px); color: var(--text-muted);
    font-family: var(--font-monospace, monospace);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .server-error { font-size: var(--font-ui-smaller, 12px); color: var(--text-error); }
  .server-tools { font-size: var(--font-ui-smaller, 12px); color: var(--text-faint); }
  .server-actions { display: flex; gap: var(--spacing-xs); }
  .action-btn {
    padding: 4px 8px; border: none; border-radius: var(--radius-s);
    background: var(--background-modifier-border); color: var(--text-normal);
    font-size: var(--font-ui-smaller, 12px); cursor: pointer;
    display: flex; align-items: center; gap: 4px;
  }
  .action-btn:hover { background: var(--background-modifier-hover); }
  .action-btn--danger:hover { color: var(--text-error); }
</style>
