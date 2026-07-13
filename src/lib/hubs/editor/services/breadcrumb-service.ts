export interface BreadcrumbSegment {
  label: string;
  path: string;
  isActive: boolean;
  type: 'folder' | 'note';
}

export function buildTrail(notePath: string): BreadcrumbSegment[] {
  if (!notePath) return [];

  const parts = notePath.split('/').filter(Boolean);
  if (parts.length === 0) return [];

  const trail: BreadcrumbSegment[] = [];
  let currentPath = '';

  for (let i = 0; i < parts.length; i++) {
    currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
    const isLast = i === parts.length - 1;
    trail.push({
      label: isLast ? parts[i].replace(/\.md$/i, '') : parts[i],
      path: currentPath,
      isActive: isLast,
      type: isLast ? 'note' : 'folder',
    });
  }

  return trail;
}
