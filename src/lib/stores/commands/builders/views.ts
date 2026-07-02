import type { Command } from '@/stores/commands/commands';

export function buildViewCommands(): Command[] {
  return [
    {
      id: 'view:files',
      name: 'Show File Explorer',
      description: 'Open the file tree panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('left', 'files');
      },
    },
    {
      id: 'view:open-tabs',
      name: 'Show Open Tabs',
      description: 'Open the tabs panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('left', 'open-tabs');
      },
    },
    {
      id: 'view:tags',
      name: 'Show Tags Panel',
      description: 'Open the tag explorer',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('left', 'tags');
      },
    },
    {
      id: 'view:tasks',
      name: 'Show Tasks Panel',
      description: 'Open the task manager',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('left', 'tasks');
      },
    },
    {
      id: 'view:kanban',
      name: 'Show Kanban Board',
      description: 'Open the Kanban task board',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('left', 'kanban');
      },
    },
    {
      id: 'view:templates',
      name: 'Show Templates Panel',
      description: 'Open the template manager',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('left', 'templates');
      },
    },
    {
      id: 'view:rss',
      name: 'Show RSS Reader',
      description: 'Open the RSS feed reader',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('left', 'rss');
      },
    },
    {
      id: 'view:entities',
      name: 'Show Entity Browser',
      description: 'Open the entity/knowledge browser',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('left', 'entities');
      },
    },
    {
      id: 'view:search',
      name: 'Show Search Panel',
      description: 'Open the search panel in the sidebar',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('left', 'search');
      },
    },
    {
      id: 'view:changelog',
      name: 'Show Changelog',
      description: 'Open the vault changelog panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('left', 'changelog');
      },
    },
    {
      id: 'view:publishing',
      name: 'Show Publishing Dashboard',
      description: 'Open the publishing panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('left', 'publishing');
      },
    },
    {
      id: 'view:gym',
      name: 'Show Gym Tracker',
      description: 'Open the workout/gym tracker panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('left', 'gym');
      },
    },
    {
      id: 'view:music',
      name: 'Show Music Panel',
      description: 'Open the music composition panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('left', 'music');
      },
    },
    {
      id: 'view:spreadsheet',
      name: 'Show Spreadsheet',
      description: 'Open the spreadsheet panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('left', 'spreadsheet');
      },
    },
    {
      id: 'view:media',
      name: 'Show Media Panel',
      description: 'Open the media import panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('left', 'media');
      },
    },
    {
      id: 'view:nas',
      name: 'Show NAS Panel',
      description: 'Open the NAS / WebDAV sync panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('left', 'nas');
      },
    },
    {
      id: 'view:llm',
      name: 'Show LLM Panel',
      description: 'Open the AI / LLM assistant panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('left', 'llm');
      },
    },
    {
      id: 'view:outline',
      name: 'Show Outline',
      description: 'Open the document outline panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('right', 'outline');
      },
    },
    {
      id: 'view:properties',
      name: 'Show Properties',
      description: 'Open the note properties / frontmatter panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('right', 'properties');
      },
    },
    {
      id: 'view:backlinks',
      name: 'Show Backlinks',
      description: 'Open the backlinks panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('right', 'backlinks');
      },
    },
    {
      id: 'view:outgoing-links',
      name: 'Show Outgoing Links',
      description: 'Open the outgoing links panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('right', 'outgoing');
      },
    },
    {
      id: 'view:git',
      name: 'Show Git Panel',
      description: 'Open the Git version control panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('right', 'git');
      },
    },
    {
      id: 'view:calendar',
      name: 'Show Calendar',
      description: 'Open the calendar panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('right', 'calendar');
      },
    },
    {
      id: 'view:writing',
      name: 'Show Writing Lint',
      description: 'Open the writing quality / lint panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('right', 'writing');
      },
    },
    {
      id: 'view:voice',
      name: 'Show Voice Panel',
      description: 'Open the voice recording panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('right', 'voice');
      },
    },
    {
      id: 'view:recipe',
      name: 'Show Recipe View',
      description: 'Open the interactive recipe panel',
      category: 'Views',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('right', 'recipe');
      },
    },
  ];
}
