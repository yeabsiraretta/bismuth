<script lang="ts">
  import FileTree from '@/components/vault/FileTree.svelte';
  import EditorTabs from '@/components/editor/EditorTabs.svelte';
  import RecentPanel from '@/components/sidebar/panels/RecentPanel.svelte';
  import AsyncFeature from '@/components/ui/layout/AsyncLoader.svelte';

  export let activeTab: string;
  export let onOpenNote: (path: string) => void;
</script>

{#if activeTab === 'open-tabs'}
  <EditorTabs />
{:else if activeTab === 'files'}
  <FileTree />
{:else if activeTab === 'recent'}
  <RecentPanel {onOpenNote} />
{:else if activeTab === 'search'}
  <AsyncFeature featureId="search" loader={() => import('@/features/search').then(m => ({ default: m.SearchPanel }))} />
{:else if activeTab === 'inbox'}
  <AsyncFeature featureId="capture" loader={() => import('@/features/capture').then(m => ({ default: m.CaptureDashboard }))} />
{:else if activeTab === 'tags'}
  <AsyncFeature featureId="tag" loader={() => import('@/features/tag').then(m => ({ default: m.TagPanel }))} />
{:else if activeTab === 'entities'}
  <AsyncFeature featureId="entity" loader={() => import('@/features/entity').then(m => ({ default: m.EntityBrowser }))} props={{ onOpenNote }} />
{:else if activeTab === 'tasks'}
  <AsyncFeature featureId="tasks" loader={() => import('@/features/tasks').then(m => ({ default: m.TaskPanel }))} />
{:else if activeTab === 'gamify'}
  <AsyncFeature featureId="gamify" loader={() => import('@/features/gamify').then(m => ({ default: m.TaskPanelUnified }))} />
{:else if activeTab === 'kanban'}
  <AsyncFeature featureId="tasks" loader={() => import('@/features/tasks').then(m => ({ default: m.KanbanPanel }))} />
{:else if activeTab === 'templates'}
  <AsyncFeature featureId="template" loader={() => import('@/features/template').then(m => ({ default: m.TemplatePanel }))} />
{:else if activeTab === 'changelog'}
  <AsyncFeature featureId="changelog" loader={() => import('@/features/changelog').then(m => ({ default: m.ChangelogPanel }))} />
{:else if activeTab === 'rss'}
  <AsyncFeature featureId="rss" loader={() => import('@/features/rss').then(m => ({ default: m.RssFeedList }))} />
{:else if activeTab === 'publishing'}
  <AsyncFeature featureId="publishing" loader={() => import('@/features/publishing').then(m => ({ default: m.PublicationDashboard }))} />
{:else if activeTab === 'gym'}
  <AsyncFeature featureId="gym" loader={() => import('@/features/gym').then(m => ({ default: m.GymPanel }))} />
{:else if activeTab === 'pokemon'}
  <AsyncFeature featureId="pokemon" loader={() => import('@/features/pokemon').then(m => ({ default: m.PokemonPanel }))} />
{:else if activeTab === 'spreadsheet'}
  <AsyncFeature featureId="spreadsheet" loader={() => import('@/features/spreadsheet').then(m => ({ default: m.SpreadsheetPanel }))} />
{:else if activeTab === 'music'}
  <AsyncFeature featureId="music" loader={() => import('@/features/music').then(m => ({ default: m.MusicPanel }))} />
{:else if activeTab === 'media'}
  <AsyncFeature featureId="media" loader={() => import('@/features/media').then(m => ({ default: m.MediaPanel }))} />
{:else if activeTab === 'nas'}
  <AsyncFeature featureId="nas" loader={() => import('@/features/nas').then(m => ({ default: m.NasPanel }))} />
{:else if activeTab === 'ocr'}
  <AsyncFeature featureId="ocr" loader={() => import('@/features/ocr').then(m => ({ default: m.OcrImportDialog }))} />
{:else if activeTab === 'llm'}
  <AsyncFeature featureId="llm" loader={() => import('@/features/llm').then(m => ({ default: m.LlmPanel }))} />
{:else if activeTab === 'navigator'}
  <AsyncFeature featureId="navigator" loader={() => import('@/features/navigator').then(m => ({ default: m.Navigator }))} />
{:else if activeTab === 'longform'}
  <AsyncFeature featureId="longform" loader={() => import('@/features/longform').then(m => ({ default: m.LongformPanel }))} />
{:else if activeTab === 'storyteller'}
  <AsyncFeature featureId="storyteller" loader={() => import('@/features/storyteller').then(m => ({ default: m.StorytellerDashboard }))} />
{:else if activeTab === 'arbor'}
  <AsyncFeature featureId="arbor" loader={() => import('@/features/arbor').then(m => ({ default: m.ArborEditor }))} />
{:else if activeTab === 'vault-flashcards'}
  <AsyncFeature featureId="flashcards" loader={() => import('@/features/flashcards').then(m => ({ default: m.VaultFlashcardPanel }))} />
{:else if activeTab === 'importer'}
  <AsyncFeature featureId="importer" loader={() => import('@/features/importer').then(m => ({ default: m.ImporterPanel }))} />
{:else if activeTab === 'canvas'}
  <AsyncFeature featureId="canvas" loader={() => import('@/features/canvas').then(m => ({ default: m.CanvasApp }))} />
{:else if activeTab === 'annotator'}
  <AsyncFeature featureId="annotator" loader={() => import('@/features/annotator').then(m => ({ default: m.AnnotatorPanel }))} />
{:else if activeTab === 'timekeep'}
  <AsyncFeature featureId="timekeep" loader={() => import('@/features/timekeep').then(m => ({ default: m.TimekeepPanel }))} />
{/if}
