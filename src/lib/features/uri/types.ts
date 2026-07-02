/**
 * Advanced URI types — defines the URL scheme and action payloads for
 * the `bismuth://` deep link protocol.
 *
 * URI format: bismuth://action?param1=value1&param2=value2
 *
 * Examples:
 *   bismuth://open?vault=MyVault&filepath=notes/todo.md
 *   bismuth://open?vault=MyVault&filepath=notes/todo.md&heading=Goals
 *   bismuth://edit?vault=MyVault&filepath=notes/todo.md&data=Hello&mode=append
 *   bismuth://create?vault=MyVault&filepath=notes/new.md&data=Initial%20content
 *   bismuth://daily?vault=MyVault&data=Clipboard%20text&mode=append
 *   bismuth://command?vault=MyVault&commandid=note:new
 *   bismuth://search?vault=MyVault&query=project%20plan
 *   bismuth://searchreplace?vault=MyVault&filepath=notes/todo.md&search=old&replace=new
 *   bismuth://frontmatter?vault=MyVault&filepath=notes/todo.md&frontmatterkey=status
 *   bismuth://frontmatter?vault=MyVault&filepath=notes/todo.md&frontmatterkey=tags&data=[a,b]
 *   bismuth://canvas?vault=MyVault&canvasid=abc&x=100&y=200&zoom=1.5
 *   bismuth://workspace?vault=MyVault&workspace=writing
 *   bismuth://bookmark?vault=MyVault&bookmark=Research
 */

/** All supported URI action verbs. */
export type UriAction =
  | 'open'
  | 'edit'
  | 'create'
  | 'daily'
  | 'command'
  | 'search'
  | 'searchreplace'
  | 'frontmatter'
  | 'canvas'
  | 'workspace'
  | 'bookmark'
  | 'annotate';

/** Write mode for edit/create/daily actions. */
export type WriteMode = 'overwrite' | 'append' | 'prepend' | 'new';

/** Parsed Advanced URI with all possible parameters. */
export interface ParsedUri {
  /** The action verb from the URL path. */
  action: UriAction;

  /** Target vault name. */
  vault?: string;

  /** Relative file path within the vault (e.g. "notes/todo.md"). */
  filepath?: string;

  /** Heading to navigate to within the file. */
  heading?: string;

  /** Block ID to navigate to within the file. */
  block?: string;

  /** Line number to navigate to. */
  line?: number;

  /** Data/content payload for edit/create/daily actions. */
  data?: string;

  /** Whether to use clipboard content as data. */
  clipboard?: boolean;

  /** Write mode for content modification actions. */
  mode?: WriteMode;

  /** Command ID for the 'command' action. */
  commandid?: string;

  /** Search query for the 'search' action. */
  query?: string;

  /** Search term for 'searchreplace' action. */
  search?: string;

  /** Replacement term for 'searchreplace' action. */
  replace?: string;

  /** Whether search/replace uses regex. */
  regex?: boolean;

  /** Frontmatter key for the 'frontmatter' action. */
  frontmatterkey?: string;

  /** Canvas ID for the 'canvas' action. */
  canvasid?: string;

  /** Canvas viewport X position. */
  x?: number;

  /** Canvas viewport Y position. */
  y?: number;

  /** Canvas viewport zoom level. */
  zoom?: number;

  /** Workspace name for the 'workspace' action. */
  workspace?: string;

  /** Bookmark name for the 'bookmark' action. */
  bookmark?: string;

  /** Whether to create the file if it doesn't exist (for open/edit). */
  ifnotexists?: boolean;

  /** Whether to open in a new tab. */
  newpane?: boolean;

  /** View mode to open in. */
  viewmode?: 'source' | 'preview' | 'live';

  /** All raw query parameters (for extension/future use). */
  raw: Record<string, string>;
}

/** Result of a URI action execution. */
export interface UriActionResult {
  /** Whether the action succeeded. */
  success: boolean;
  /** Error message if the action failed. */
  error?: string;
  /** Any data returned by the action (e.g., frontmatter value). */
  data?: unknown;
}
