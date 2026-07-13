import type { Extension } from '@codemirror/state';

import { registerDeferredExtension } from '@/hubs/editor/services/lazy-extensions';

registerDeferredExtension(async (): Promise<Extension | Extension[]> => {
  const [
    { highlightExtension },
    { strikethroughExtension },
    { tagExtension },
    { checkboxExtension },
    { calloutExtension },
    { embedExtension },
    { codeblockExtension },
    { treeExtension },
    { imageExtension },
    { flashcardExtension },
    { footnoteExtension },
    { tasksExtension },
  ] = await Promise.all([
    import('@/hubs/editor/services/highlight-extension'),
    import('@/hubs/editor/services/strikethrough-extension'),
    import('@/hubs/editor/services/tag-extension'),
    import('@/hubs/editor/services/checkbox-extension'),
    import('@/hubs/editor/services/callout-extension'),
    import('@/hubs/editor/services/embed-extension'),
    import('@/hubs/editor/services/codeblock-extension'),
    import('@/hubs/editor/services/tree-extension'),
    import('@/hubs/editor/services/image-extension'),
    import('@/hubs/editor/services/flashcard-extension'),
    import('@/hubs/editor/services/footnote-extension'),
    import('@/hubs/editor/services/tasks-extension'),
  ]);

  return [
    ...highlightExtension(),
    ...strikethroughExtension(),
    ...tagExtension(),
    ...checkboxExtension(),
    ...calloutExtension(),
    ...embedExtension(),
    ...codeblockExtension(),
    ...treeExtension(),
    ...imageExtension(),
    ...flashcardExtension(),
    ...footnoteExtension(),
    ...tasksExtension(),
  ];
});
