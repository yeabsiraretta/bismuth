import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
  moveLineUp, moveLineDown,
  duplicateLineUp, duplicateLineDown, duplicateSelection,
  insertLineAbove, insertLineBelow,
  joinLines, sortLines, reverseLines,
} from '../services/keyshotsActions';
import {
  transformUppercase, transformLowercase, transformTitlecase,
  toggleCase, toggleSnakecase, toggleKebabcase,
  encodeUri, trimSelection,
  expandLineSelection,
  addCursorUp, addCursorDown,
  insertCodeBlock,
  indent, outdent,
} from '../services/keyshotsTransforms';

function makeView(doc: string, anchor?: number, head?: number): EditorView {
  const state = EditorState.create({
    doc,
    selection: { anchor: anchor ?? 0, head: head ?? anchor ?? 0 },
    extensions: [EditorState.allowMultipleSelections.of(true)],
  });
  return new EditorView({ state });
}

function docOf(view: EditorView): string {
  return view.state.doc.toString();
}

describe('moveLineUp', () => {
  it('moves line up', () => {
    const v = makeView('aaa\nbbb\nccc', 4);
    moveLineUp(v);
    expect(docOf(v)).toBe('bbb\naaa\nccc');
  });

  it('does nothing at line 1', () => {
    const v = makeView('aaa\nbbb', 0);
    expect(moveLineUp(v)).toBe(false);
  });
});

describe('moveLineDown', () => {
  it('moves line down', () => {
    const v = makeView('aaa\nbbb\nccc', 0);
    moveLineDown(v);
    expect(docOf(v)).toBe('bbb\naaa\nccc');
  });

  it('does nothing at last line', () => {
    const v = makeView('aaa\nbbb', 4);
    expect(moveLineDown(v)).toBe(false);
  });
});

describe('duplicateLineDown', () => {
  it('duplicates line below', () => {
    const v = makeView('aaa\nbbb', 0);
    duplicateLineDown(v);
    expect(docOf(v)).toBe('aaa\naaa\nbbb');
  });
});

describe('duplicateLineUp', () => {
  it('duplicates line above', () => {
    const v = makeView('aaa\nbbb', 0);
    duplicateLineUp(v);
    expect(docOf(v)).toBe('aaa\naaa\nbbb');
  });
});

describe('duplicateSelection', () => {
  it('duplicates selected text', () => {
    const v = makeView('hello world', 0, 5);
    duplicateSelection(v);
    expect(docOf(v)).toBe('hellohello world');
  });

  it('duplicates line when no selection', () => {
    const v = makeView('aaa\nbbb', 0, 0);
    duplicateSelection(v);
    expect(docOf(v)).toBe('aaa\naaa\nbbb');
  });
});

describe('insertLineAbove', () => {
  it('inserts empty line above', () => {
    const v = makeView('aaa\nbbb', 0);
    insertLineAbove(v);
    expect(docOf(v)).toBe('\naaa\nbbb');
  });
});

describe('insertLineBelow', () => {
  it('inserts empty line below', () => {
    const v = makeView('aaa\nbbb', 0);
    insertLineBelow(v);
    expect(docOf(v)).toBe('aaa\n\nbbb');
  });
});

describe('joinLines', () => {
  it('joins current line with next', () => {
    const v = makeView('aaa\nbbb\nccc', 0);
    joinLines(v);
    expect(docOf(v)).toBe('aaa bbb\nccc');
  });

  it('joins multiple selected lines', () => {
    const v = makeView('aaa\nbbb\nccc', 0, 11);
    joinLines(v);
    expect(docOf(v)).toBe('aaa bbb ccc');
  });
});

describe('sortLines', () => {
  it('sorts selected lines alphabetically', () => {
    const v = makeView('cherry\napple\nbanana', 0, 19);
    sortLines(v);
    expect(docOf(v)).toBe('apple\nbanana\ncherry');
  });

  it('returns false for single line', () => {
    const v = makeView('only', 0, 4);
    expect(sortLines(v)).toBe(false);
  });
});

describe('reverseLines', () => {
  it('reverses line order', () => {
    const v = makeView('aaa\nbbb\nccc', 0, 11);
    reverseLines(v);
    expect(docOf(v)).toBe('ccc\nbbb\naaa');
  });
});

describe('transformUppercase', () => {
  it('converts to uppercase', () => {
    const v = makeView('hello', 0, 5);
    transformUppercase(v);
    expect(docOf(v)).toBe('HELLO');
  });

  it('returns false with no selection', () => {
    const v = makeView('hello', 0);
    expect(transformUppercase(v)).toBe(false);
  });
});

describe('transformLowercase', () => {
  it('converts to lowercase', () => {
    const v = makeView('HELLO', 0, 5);
    transformLowercase(v);
    expect(docOf(v)).toBe('hello');
  });
});

describe('transformTitlecase', () => {
  it('capitalizes first letter of each word', () => {
    const v = makeView('hello world', 0, 11);
    transformTitlecase(v);
    expect(docOf(v)).toBe('Hello World');
  });
});

describe('toggleCase', () => {
  it('upper → lower', () => {
    const v = makeView('HELLO', 0, 5);
    toggleCase(v);
    expect(docOf(v)).toBe('hello');
  });

  it('lower → upper', () => {
    const v = makeView('hello', 0, 5);
    toggleCase(v);
    expect(docOf(v)).toBe('HELLO');
  });
});

describe('toggleSnakecase', () => {
  it('camelCase → snake_case', () => {
    const v = makeView('myVariable', 0, 10);
    toggleSnakecase(v);
    expect(docOf(v)).toBe('my_variable');
  });

  it('snake_case → camelCase', () => {
    const v = makeView('my_variable', 0, 11);
    toggleSnakecase(v);
    expect(docOf(v)).toBe('myVariable');
  });
});

describe('toggleKebabcase', () => {
  it('camelCase → kebab-case', () => {
    const v = makeView('myVariable', 0, 10);
    toggleKebabcase(v);
    expect(docOf(v)).toBe('my-variable');
  });

  it('kebab-case → camelCase', () => {
    const v = makeView('my-variable', 0, 11);
    toggleKebabcase(v);
    expect(docOf(v)).toBe('myVariable');
  });
});

describe('encodeUri', () => {
  it('encodes plain text', () => {
    const v = makeView('hello world', 0, 11);
    encodeUri(v);
    expect(docOf(v)).toBe('hello%20world');
  });

  it('decodes encoded text', () => {
    const v = makeView('hello%20world', 0, 13);
    encodeUri(v);
    expect(docOf(v)).toBe('hello world');
  });
});

describe('trimSelection', () => {
  it('trims whitespace', () => {
    const v = makeView('  hello  ', 0, 9);
    trimSelection(v);
    expect(docOf(v)).toBe('hello');
  });
});

describe('expandLineSelection', () => {
  it('expands to full line', () => {
    const v = makeView('aaa\nbbb\nccc', 5);
    expandLineSelection(v);
    const sel = v.state.selection.main;
    expect(v.state.sliceDoc(sel.from, sel.to)).toBe('bbb');
  });
});

describe('addCursorUp / addCursorDown', () => {
  it('adds cursor above', () => {
    const v = makeView('aaa\nbbb', 4);
    addCursorUp(v);
    expect(v.state.selection.ranges.length).toBe(2);
  });

  it('adds cursor below', () => {
    const v = makeView('aaa\nbbb', 0);
    addCursorDown(v);
    expect(v.state.selection.ranges.length).toBe(2);
  });

  it('does nothing at first line going up', () => {
    const v = makeView('aaa', 0);
    expect(addCursorUp(v)).toBe(false);
  });
});

describe('insertCodeBlock', () => {
  it('inserts empty code block', () => {
    const v = makeView('text', 4);
    insertCodeBlock(v);
    expect(docOf(v)).toBe('text```\n\n```');
  });

  it('wraps selection in code block', () => {
    const v = makeView('code here', 0, 9);
    insertCodeBlock(v);
    expect(docOf(v)).toBe('```\ncode here\n```');
  });
});

describe('indent / outdent', () => {
  it('indents lines', () => {
    const v = makeView('aaa\nbbb', 0, 7);
    indent(v);
    expect(docOf(v)).toBe('  aaa\n  bbb');
  });

  it('outdents lines', () => {
    const v = makeView('  aaa\n  bbb', 0, 11);
    outdent(v);
    expect(docOf(v)).toBe('aaa\nbbb');
  });

  it('outdent does nothing with no leading spaces', () => {
    const v = makeView('aaa', 0, 3);
    expect(outdent(v)).toBe(false);
  });
});
