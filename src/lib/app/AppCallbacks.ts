/** Root app callback surface — injected from App.svelte into bootstrap and command registration. */
export interface AppCallbacks {
  openCommandPalette: () => void;
  openAutoLinker: () => void;
  openSettings: () => void;
  openCommandsMode: () => void;
  setLeftTab: (tab: string) => void;
}
