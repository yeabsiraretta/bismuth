export interface VaultTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  folders: string[];
  starterNotes: string[];
}

export const VAULT_TEMPLATES: VaultTemplate[] = [
  {
    id: 'para',
    title: 'PARA',
    description:
      'Projects, Areas, Resources, Archive — GTD-style action management with Inbox and project templates.',
    icon: 'tmpl-para',
    folders: ['Inbox/', 'Projects/', 'Areas/', 'Resources/', 'Archive/'],
    starterNotes: ['Inbox/Welcome.md', 'Projects/Example Project.md'],
  },
  {
    id: 'johnny-decimal',
    title: 'Johnny.Decimal',
    description:
      'Numbered areas and categories (10-19, 20-29 …) with a master index for strict hierarchical organization.',
    icon: 'tmpl-decimal',
    folders: ['00-09 System/', '10-19 Personal/', '20-29 Work/', '30-39 Learning/'],
    starterNotes: ['00-09 System/00.00 Index.md'],
  },
  {
    id: 'zettelkasten',
    title: 'Zettelkasten',
    description:
      'Atomic, interconnected notes — Inbox, Permanent, Literature, and Structure note folders for deep thinking.',
    icon: 'tmpl-zettelkasten',
    folders: ['Inbox/', 'Permanent/', 'Literature/', 'Structure/', 'Reference/'],
    starterNotes: ['Inbox/Welcome.md', 'Structure/Index.md'],
  },
  {
    id: 'academic',
    title: 'Academic',
    description:
      'Courses, research papers, lecture notes, and thesis projects — built for students and researchers.',
    icon: 'tmpl-academic',
    folders: ['Courses/', 'Research/', 'Lectures/', 'Papers/', 'Thesis/'],
    starterNotes: ['Courses/Template.md', 'Research/Reading List.md'],
  },
  {
    id: 'digital-garden',
    title: 'Digital Garden',
    description:
      'Seedlings, budding ideas, and evergreen notes — grow your knowledge organically over time.',
    icon: 'tmpl-garden',
    folders: ['Seeds/', 'Budding/', 'Evergreen/', 'Maps/'],
    starterNotes: ['Maps/Welcome to Your Garden.md'],
  },
  {
    id: 'second-brain',
    title: 'Second Brain',
    description:
      "Capture, organize, distill, and express — Tiago Forte's CODE method for building a second brain.",
    icon: 'tmpl-second-brain',
    folders: ['Capture/', 'Organize/', 'Distill/', 'Express/', 'Templates/'],
    starterNotes: ['Capture/Inbox.md', 'Templates/Project Template.md'],
  },
  {
    id: 'developer',
    title: 'Developer Notes',
    description:
      'TILs, architecture decisions, code snippets, and project logs — purpose-built for software engineers.',
    icon: 'tmpl-developer',
    folders: ['TIL/', 'Architecture/', 'Snippets/', 'Projects/', 'Runbooks/'],
    starterNotes: ['TIL/Example.md', 'Architecture/ADR Template.md'],
  },
  {
    id: 'moc',
    title: 'Maps of Content',
    description:
      "Top-down MOC structure with Atlas, Calendar, and Cards — Nick Milo's Linking Your Thinking approach.",
    icon: 'tmpl-moc',
    folders: ['Atlas/', 'Calendar/', 'Cards/', 'Extras/', 'Sources/'],
    starterNotes: ['Atlas/Home.md', 'Atlas/MOC Template.md'],
  },
];
