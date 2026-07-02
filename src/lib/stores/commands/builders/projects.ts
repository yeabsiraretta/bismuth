import type { Command } from '@/stores/commands/commands';
import { showToast } from '@/stores/toast/toast';

export function buildProjectCommands(): Command[] {
  return [
    {
      id: 'pm:open',
      name: 'Project Manager: Open projects pane',
      description: 'Open the project list',
      category: 'Projects',
      action: async () => {
        showToast('Open Project Manager from the sidebar', 'info');
      },
    },
    {
      id: 'pm:create-project',
      name: 'Project Manager: Create new project',
      description: 'Open the new project modal',
      category: 'Projects',
      action: async () => {
        showToast('Open Project Manager and click + to create a project', 'info');
      },
    },
    {
      id: 'pm:create-task',
      name: 'Project Manager: Create new task',
      description: 'Pick a project, then create a task',
      category: 'Projects',
      action: async () => {
        showToast('Open a project and use + Add task in the Table view', 'info');
      },
    },
    {
      id: 'pm:import-notes',
      name: 'Project Manager: Import notes as tasks',
      description: 'Convert Markdown notes into project tasks',
      category: 'Projects',
      action: async () => {
        showToast('Import notes feature — coming soon', 'info');
      },
    },
    {
      id: 'pm:open-file-as-project',
      name: 'Project Manager: Open current file as project',
      description: 'Open the active note as a project (needs pm-project: true)',
      category: 'Projects',
      action: async () => {
        const { get } = await import('svelte/store');
        const { activeNote } = await import('@/stores/vault/vault');
        const note = get(activeNote);
        if (!note?.path) {
          showToast('No active note selected', 'warning');
          return;
        }
        const { readProjectFile } = await import('@/features/projects');
        const project = await readProjectFile(note.path);
        if (!project) {
          showToast('This note is not a project (add pm-project: true to frontmatter)', 'warning');
          return;
        }
        const { openProject } = await import('@/features/projects');
        openProject(project.id);
        showToast(`Opened project: ${project.name}`, 'info');
      },
    },
  ];
}
