import type { AppCallbacks } from './AppCallbacks';

/** Registers all default app commands with the command palette. */
export function registerAppCommands(callbacks: AppCallbacks, handleNewNote: () => Promise<void>, handlePublish: () => Promise<void>): void {
  import('@/stores/commands/commands').then(({ registerDefaultCommands }) => {
    import('@/features/capture').then(({ quickCapture }) => {
      import('@/stores/layout/layout').then(({ toggleLeftSidebar, toggleRightSidebar }) => {
        registerDefaultCommands({
          newNote: handleNewNote,
          openSearch: callbacks.openCommandPalette,
          openCommandPalette: callbacks.openCommandPalette,
          openSettings: callbacks.openSettings,
          toggleLeftSidebar,
          toggleRightSidebar,
          quickCapture: () => quickCapture(),
          openGraph: () => callbacks.setLeftTab('graph'),
          openCaptureDashboard: () => callbacks.setLeftTab('inbox'),
          openAutoLinker: callbacks.openAutoLinker,
          publishSite: handlePublish,
        });
      });
    });
  });
}
