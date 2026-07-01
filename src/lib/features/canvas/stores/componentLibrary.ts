// Bridge module — vault.ts (sandboxed) uses a dynamic import to this path.
// Forwards to the implementation at library/componentLibrary.ts.
export {
  loadLibrary,
  components,
  searchQuery,
  categoryFilter,
  editingComponentId,
  filteredComponents,
  categories,
  isLoading,
  getComponentById,
  placeComponentInstance,
  createComponentFromSelection,
  deleteComponentFromLibrary,
  saveComponentToLibrary,
  setSearchQuery,
  setCategoryFilter,
} from './library/componentLibrary';
