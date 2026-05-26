<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Note } from '@/types/vault';
	import Icon from '@/components/icons/Icon.svelte';

	export let notes: Note[] = [];
	export let onSelect: (noteName: string) => void;
	export let onClose: () => void;
	export let query: string = '';
	export let position: { top: number; left: number } = { top: 0, left: 0 };

	let selectedIndex = 0;
	let filteredNotes: Note[] = [];

	$: {
		if (query) {
			filteredNotes = notes
				.filter((note) =>
					note.title.toLowerCase().includes(query.toLowerCase())
				)
				.slice(0, 10);
		} else {
			filteredNotes = notes.slice(0, 10);
		}
		selectedIndex = 0;
	}

	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, filteredNotes.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, 0);
				break;
			case 'Enter':
				event.preventDefault();
				if (filteredNotes[selectedIndex]) {
					onSelect(filteredNotes[selectedIndex].title);
				}
				break;
			case 'Escape':
				event.preventDefault();
				onClose();
				break;
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeydown);
	});
</script>

<div
	class="wikilink-autocomplete"
	style="top: {position.top}px; left: {position.left}px;"
>
	{#if filteredNotes.length > 0}
		<div class="autocomplete-list">
			{#each filteredNotes as note, index}
				<button
					class="autocomplete-item"
					class:selected={index === selectedIndex}
					on:click={() => onSelect(note.title)}
				>
					<Icon name="file-text" size={16} />
					<span class="note-title">{note.title}</span>
					{#if note.path}
						<span class="note-path">{note.path}</span>
					{/if}
				</button>
			{/each}
		</div>
	{:else}
		<div class="autocomplete-empty">
			<Icon name="search" size={16} />
			<span>No notes found</span>
		</div>
	{/if}
</div>

<style>
	.wikilink-autocomplete {
		position: fixed;
		z-index: 1000;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		min-width: 300px;
		max-width: 500px;
		max-height: 400px;
		overflow-y: auto;
	}

	.autocomplete-list {
		padding: 4px;
	}

	.autocomplete-item {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 8px 12px;
		border: none;
		background: transparent;
		color: var(--color-text);
		text-align: left;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.autocomplete-item:hover,
	.autocomplete-item.selected {
		background: var(--color-surface-hover);
	}

	.note-title {
		flex: 1;
		font-weight: 500;
	}

	.note-path {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.autocomplete-empty {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 16px;
		color: var(--color-text-muted);
		justify-content: center;
	}
</style>
