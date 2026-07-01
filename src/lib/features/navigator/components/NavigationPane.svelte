<script lang="ts">
  import NavFolderNode from './NavFolderNode.svelte';
  import NavTagTree from './NavTagTree.svelte';
  import NavPropertyBrowser from './NavPropertyBrowser.svelte';
  import { navigatorStore, setActivePane } from '../stores/navigator';
  import { selectFolderWithHistory } from '../stores/navigatorActions';
  import { notes } from '@/stores/vault/vault';

  interface FolderNode {
    name: string;
    path: string;
    children: FolderNode[];
    noteCount: number;
  }

  interface TreeBuildNode {
    name: string;
    path: string;
    _children: Record<string, TreeBuildNode>;
    noteCount: number;
  }

  let expandedFolders = new Set<string>();

  $: folderTree = buildFolderTree($notes.map(n => n.path));
  $: activeTab = $navigatorStore.activeTab;

  function buildFolderTree(paths: string[]): FolderNode[] {
    const root: Record<string, TreeBuildNode> = {};

    for (const path of paths) {
      const parts = path.split('/');
      if (parts.length <= 1) continue;
      const dirParts = parts.slice(0, -1);
      let current: Record<string, TreeBuildNode> = root;
      let currentPath = '';

      for (const part of dirParts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        if (!current[part]) {
          current[part] = { name: part, path: currentPath, _children: {}, noteCount: 0 };
        }
        current[part].noteCount++;
        current = current[part]._children;
      }
    }

    return flattenTree(root);
  }

  function flattenTree(obj: Record<string, TreeBuildNode>): FolderNode[] {
    return Object.values(obj)
      .map(node => ({
        name: node.name,
        path: node.path,
        noteCount: node.noteCount,
        children: flattenTree(node._children),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  export function toggleExpand(path: string) {
    if (expandedFolders.has(path)) expandedFolders.delete(path);
    else expandedFolders.add(path);
    expandedFolders = expandedFolders;
  }

  export function handleFolderClick(folder: FolderNode) {
    selectFolderWithHistory(folder.path);
    setActivePane('list');
  }

  export function handleKeydown(e: KeyboardEvent, folder: FolderNode) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFolderClick(folder);
    }
    if (e.key === 'ArrowRight' && !expandedFolders.has(folder.path)) {
      toggleExpand(folder.path);
    }
    if (e.key === 'ArrowLeft' && expandedFolders.has(folder.path)) {
      toggleExpand(folder.path);
    }
  }
</script>

<div class="navigation-pane-content">
  {#if activeTab === 'folders'}
    <div class="tree" role="tree">
      {#each folderTree as folder (folder.path)}
        <NavFolderNode
          node={folder}
          depth={0}
          {expandedFolders}
          selectedPath={$navigatorStore.selectedFolder}
          onToggleExpand={toggleExpand}
          onFolderClick={handleFolderClick}
          {handleKeydown}
        />
      {/each}
    </div>
  {:else if activeTab === 'tags'}
    <NavTagTree />
  {:else}
    <NavPropertyBrowser />
  {/if}
</div>

<style>
  .navigation-pane-content { padding: 0; height: 100%; overflow-y: auto; }
  .tree { padding: 4px; }
</style>
