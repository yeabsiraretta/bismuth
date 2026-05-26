# Feature Specification: Bismuth — Personal Knowledge Management Editor

**Feature Branch**: `001-bismuth-pkm-editor`

**Created**: 2026-05-25

**Status**: Draft

**Input**: User description: "Building a highly modular and extensive text editor used as a secondary brain and personal knowledge management system. Spiritual successor to Obsidian with bundled plugins, graph view, entity linking (Portent model), theming, extensibility, long-form writing, annotation, code editing, and web publishing."

---

## User Scenarios & Testing *(mandatory)*

### Story Groups — Thematic Reference

Stories are documented in the order they were specified. The map below shows intended thematic groupings. **All new stories must be inserted within their logical group going forward.** Two story pairs (US13+US21, US23+US24) have been merged because the features are inseparable in practice.

| Group | Stories | Theme |
|-------|---------|-------|
| **A — Core Foundation** | US1, US2, US7, US8, US27 | Vault, editor, wikilinks, graph, tags, full-text search, semantic connections |
| **B — Knowledge & Lifecycle** | US3, US11, US12 | Entity system, lifecycle triage, template engine |
| **C — Workspace & Navigation** | US15, US17, US26 | Notebook navigator, vertical tabs & tab groups, recent files sidebar |
| **D — Content Authoring** | US5, US6, US14, US28, US29, US30 | Writing tools, annotation, code editing, typing rules, rich editing toolbar, typewriter mode, LaTeX math suite |
| **E — Visual & Spatial** | US9, US19 | Canvas, branching block editor |
| **F — Long-form Creative** | US16, US18, US20 | Note sequencer, manuscript builder, radial timeline |
| **G — Content Consumption** | US13 *(incl. US21)* | RSS/media feeds & RSVP speed reader |
| **H — Integration & Automation** | US10, US22, US25, US31 | REST API & MCP, Git version control, vault changelog, digital garden publishing |
| **I — Customization & Startup** | US4, US23 *(incl. US24)* | Theming, plugins, homepage, personal tips |

---

### User Story 1 — Core Vault and Editor *(Group A: Core Foundation)* (Priority: P1)

A user opens Bismuth to a welcome screen with two options: start a blank vault or start from a vault template (PARA, Johnny Decimal, Zettelkasten, etc.). After selecting or creating a vault (a root folder on disk), they navigate the file tree, create and open markdown notes, edit them in a fast split-pane editor with full markdown rendering, and save changes — all with sub-100 ms response times on vaults up to 500 000 files.

**Why this priority**: Everything else depends on a reliable, fast vault + editor core. Without this nothing is functional.

**Independent Test**: A user can open a folder as a vault, create a new note, write markdown, and see it rendered — with no other features enabled.

**Acceptance Scenarios**:

1. **Given** no vault is open, **When** the user launches Bismuth, **Then** the welcome screen appears with two centered options (blank vault with `+`, template vault selector) on a dark background.
2. **Given** a vault is open, **When** the user creates a note, **Then** a new markdown file appears in the file tree and opens in the editor within 200 ms.
3. **Given** a vault with 100 000 files, **When** the user navigates the file tree, **Then** the tree renders and responds to scroll and expand/collapse interactions within 100 ms.
4. **Given** an open note, **When** the user types markdown, **Then** the editor renders syntax highlighting and preview without perceptible lag (< 16 ms per frame).
5. **Given** the editor has unsaved content, **When** the application is closed unexpectedly, **Then** the content is recovered on next open.

---

### User Story 2 — Wikilinks and Graph View *(Group A: Core Foundation)* (Priority: P2)

A user adds `[[Note Title]]` wikilinks inside any note. Bismuth resolves them across the vault, renders them as clickable links, and allows the user to open a graph view showing all notes as nodes and all wikilinks as directed, color-coded edges. The user can filter nodes by tag, type, folder, or link depth, and can inspect or navigate to any node from the graph.

**Why this priority**: The knowledge graph is the core differentiator from a plain editor and is central to the PKM use case.

**Independent Test**: With a small vault of ten interlinked notes, the graph renders all nodes and edges correctly, filter controls reduce displayed nodes, and clicking a node opens the note.

**Acceptance Scenarios**:

1. **Given** a note containing `[[Target Note]]`, **When** the target note exists, **Then** the wikilink renders as a clickable link and both notes appear as connected nodes in graph view.
2. **Given** the graph view is open, **When** the user applies a tag filter, **Then** only nodes matching that tag and their direct connections remain visible.
3. **Given** the graph view is open, **When** the user selects an edge, **Then** the edge displays its direction (source → target) and color can be set by the user.
4. **Given** a vault with 10 000 notes, **When** the graph view loads, **Then** the initial render completes in under 3 seconds and panning/zooming remains above 30 fps.
5. **Given** a wikilink target does not exist, **When** the link is rendered, **Then** it appears visually distinct (unresolved state) and clicking it offers to create the missing note.

---

### User Story 3 — Entity System and Deep Linking *(Group B: Knowledge & Lifecycle)* (Priority: P3)

A user can assign a Portent type (`Project`, `Responsibility`, `Event`, `Note`, `Topic`, `Person`, `Operation`, `Task`) to any note via YAML frontmatter. Bismuth reads these types and renders typed icons and metadata panels. The user can create `belongs_to` and `related_to` relationships between entities, browse a structured entity view, and benefit from automatic backlink detection. Concept linking surfaces existing notes whose titles or frequent terms match inline text in the current note.

**Why this priority**: Typed entities and deep linking elevate Bismuth from a plain markdown editor to a knowledge graph and second-brain tool. Wikilinks alone (US2) are insufficient for structured knowledge.

**Independent Test**: A user can set `type: Project` in a note's frontmatter, open the entity panel, and see all related notes resolved through `belongs_to` and `related_to` fields without any other feature active.

**Acceptance Scenarios**:

1. **Given** a note has `type: Event` in frontmatter, **When** the entity panel is opened, **Then** Bismuth displays the lifecycle state, relationships, and type icon correctly.
2. **Given** a note contains the phrase "knowledge graphs", **When** another note titled "Knowledge Graphs" exists in the vault, **Then** Bismuth highlights the phrase and offers a link suggestion.
3. **Given** two notes linked via `belongs_to`, **When** the parent note is viewed, **Then** Bismuth lists all child notes in the entity relationship panel.
4. **Given** a note is archived, **When** the default vault view is active, **Then** the archived note is hidden from active views but remains searchable and referenceable.
5. **Given** a user wants a custom entity type, **When** they define it following the extension rules, **Then** Bismuth respects it without breaking existing types.

---

### User Story 4 — Theming, Customization, and Plugin System *(Group I: Customization & Startup)* (Priority: P4)

A user can apply a custom theme to Bismuth by dropping a CSS file (or equivalent styling format) into the vault's `themes/` folder. A built-in plugin API exposes a `plugins/` folder; contributors can add a plugin by forking the repository and placing code there. The top editor toolbar (two rows, icon-driven) and layout system let the user configure which panels are visible, choose from preset layouts, and persist preferences per vault.

**Why this priority**: Appearance customization and extensibility are table-stakes for a PKM editor competing with Obsidian's ecosystem. They must be first-class and not bolted on later.

**Independent Test**: A user can drop a CSS theme file into `themes/`, restart Bismuth, and see all editor surfaces styled according to the theme with no other configuration.

**Acceptance Scenarios**:

1. **Given** a `.css` theme file in the vault's `themes/` folder, **When** Bismuth loads, **Then** all surfaces and components adopt the theme's colors, fonts, and spacing.
2. **Given** a plugin placed in the `plugins/` folder matching the plugin API contract, **When** Bismuth starts, **Then** the plugin is loaded and its registered UI contributions appear in the editor.
3. **Given** the user opens layout settings, **When** they select a preset or create a custom layout, **Then** the panel arrangement persists across sessions for that vault.
4. **Given** the user clicks the top toolbar, **When** they interact with formatting icons (bold, underline, heading, code, etc.), **Then** the selected text in the editor is formatted immediately.
5. **Given** an invalid plugin file, **When** Bismuth loads, **Then** the plugin is skipped with a warning notification and all other functionality remains unaffected.

---

### User Story 5 — Advanced Writing, Annotation, and Export *(Group D: Content Authoring)* (Priority: P5)

A user writing long-form content can select from scene/chapter templates, run write-good linting inline, receive sidebar suggestions, highlight text with color-coded annotations, and annotate PDFs and images inline. Images can be cropped and adjusted within Bismuth. When ready to publish, the user can export a note or the entire vault as a static website (Svelte by default) or share it via Git Pages. Edit history is stored locally and can be browsed or restored. The system warns (without blocking) when files exceed size thresholds or folder nesting becomes excessively deep.

**Why this priority**: These advanced features complete the "second brain" value proposition for writers, researchers, and publishers while remaining independent of the core editor.

**Independent Test**: A user can open a note, activate the write-good linter, see inline suggestions, highlight a passage with a color annotation, and export the note as a static HTML file — all without graph, entity, or plugin features.

**Acceptance Scenarios**:

1. **Given** a note with prose content, **When** write-good linting is enabled, **Then** flagged phrases are underlined inline with explanations in the sidebar.
2. **Given** selected text in a note, **When** the user adds a highlight annotation, **Then** the highlight and comment persist on reload and appear in an organized annotation panel.
3. **Given** an image embedded in a note, **When** the user activates the image editor, **Then** they can crop and adjust brightness/contrast and save the result.
4. **Given** a vault, **When** the user triggers web export, **Then** Bismuth generates a static Svelte site with all linked notes, resolved wikilinks, and the graph view embeddable.
5. **Given** a file exceeds 10 MB or a folder nests deeper than 10 levels, **When** the condition is detected, **Then** Bismuth shows a non-blocking warning toast and allows the user to continue without interruption.
6. **Given** the user opens edit history for a note, **When** they select a past version, **Then** a side-by-side diff is shown and they can restore that version.

---

### User Story 6 — Code Editing and External Editor Integration *(Group D: Content Authoring)* (Priority: P6)

A user can open any code file in the vault in a code editor pane with syntax highlighting, autocompletion, bracket matching, and code folding on par with modern editors. A toolbar button opens the current file in the user's configured external editor (default: VS Code or Windsurf).

**Why this priority**: Code support makes Bismuth viable for developer knowledge bases and monorepo documentation vaults.

**Independent Test**: A user can open a `.py` file in the vault and see syntax highlighting, line numbers, and bracket matching without any other features active.

**Acceptance Scenarios**:

1. **Given** a code file is opened, **When** the editor renders it, **Then** syntax is highlighted for the detected language, line numbers are displayed, and bracket pairs are matched.
2. **Given** the user clicks the external editor button, **When** VS Code (or the configured alternative) is installed, **Then** the current file opens at the current cursor line in that editor.
3. **Given** a code file with more than 10 000 lines, **When** it is opened, **Then** virtual scrolling ensures render time stays under 200 ms.

---

### User Story 7 — Tag Management *(Group A: Core Foundation)* (Priority: P7)

A user can view all tags across the vault in a dedicated tag panel, search and filter tags, rename or merge tags globally, collapse tag groups, and control which tags contribute to graph connections or are hidden from active views.

**Why this priority**: Tags are a cross-cutting organizational layer. Without management tooling they become unmaintainable in large vaults.

**Independent Test**: With a vault containing fifty distinct tags, the tag panel lists them all, a search narrows the list, and renaming a tag updates all affected notes.

**Acceptance Scenarios**:

1. **Given** the tag panel is open, **When** the user searches for a tag substring, **Then** the list filters to matching tags in real time.
2. **Given** the user renames a tag, **When** the rename is confirmed, **Then** all notes containing the old tag are updated atomically and undo is supported.
3. **Given** a tag is set to hidden, **When** the graph view is open, **Then** nodes tagged only with the hidden tag are not shown.

---

### User Story 8 — Advanced Search Engine *(Group A: Core Foundation)* (Priority: P3)

A user presses a keyboard shortcut to open a unified search panel. They type a query and immediately see ranked results from every file in the vault — notes, code, and asset filenames. The engine is typo-tolerant and supports quoted phrases for exact match, `-word` exclusions, and `type:` / `tag:` expression filters. Results show a snippet, file path, and score. From any result the user can jump to the file, insert a wikilink at the cursor, or toggle to an in-file search mode that skims lines within the current document. The search panel is fully keyboard-navigable with Vim bindings and can also be queried over a local HTTP API from outside Bismuth.

**Why this priority**: Search is the primary retrieval mechanism in a large vault. Without fast, flexible search the entire knowledge base becomes hard to use as it grows.

**Independent Test**: With a 1 000-note vault, opening the search panel and typing a three-word query returns ranked results with snippets in under 200 ms.

**Acceptance Scenarios**:

1. **Given** the search panel is open, **When** the user types a query with a single character typo, **Then** the correct notes appear in the top five results.
2. **Given** the user types `"exact phrase"`, **When** results are returned, **Then** only notes containing that exact phrase are shown.
3. **Given** the user types `-exclude term`, **When** results are returned, **Then** no result contains the excluded term.
4. **Given** the user navigates results with `j` / `k` and presses Enter, **Then** the selected note opens at the matched line without touching the mouse.
5. **Given** the user selects a result and presses the insert-link shortcut, **When** a note is open, **Then** a wikilink to the result is inserted at the cursor.
6. **Given** a GET request to `http://localhost:<port>/search?q=query`, **When** Bismuth is running, **Then** the response is JSON-formatted search results matching the in-app results.
7. **Given** an image file is indexed, **When** the user searches for text visible in the image, **Then** OCR-extracted text from that image is matched (handwriting model applied when available).
8. **Given** the user opens the search panel while editing a file, **When** they toggle to in-file mode, **Then** the scope narrows to the current document with line-level snippet highlighting.

---

### User Story 27 — Semantic Connections & Vault Intelligence *(Group A: Core Foundation)* (Priority: P2)

A user opens a note and a Connections view sidebar panel immediately surfaces the most semantically similar notes in the vault — notes that are conceptually related even if they share no keywords or wikilinks. A bundled local embedding model (zero-setup, private by default, no internet required) has indexed the vault incrementally in the background since first launch; all vector computation runs on-device. The Connections view updates automatically as the user switches notes and ranks results by similarity score. The user can pause auto-updating, pin a connection to keep it visible regardless of the active note, copy all connections as a wikilink list, copy all connections’ full content for context assembly, or surface a random connection for serendipitous discovery. A separate Lookup view accepts a natural language query (e.g., “notes about decision frameworks”) and returns semantically ranked vault results independently of the current note. From either view the user can drag a connection entry into the open editor to insert a wikilink at the drop position. Configuration covers excluded path patterns, excluded frontmatter tags, minimum similarity threshold, maximum result count, and embedding model (local bundled or a configurable cloud API). Embedding vectors are cached in `.bismuth/embeddings/` and rebuilt incrementally on file save.

**Why this priority**: Wikilinks (US2) and full-text search (US8) surface only what the user explicitly linked or can name. Semantic connections surface what the user has forgotten or never connected — the core promise of a second brain that actively helps rather than passively stores.

**Independent Test**: Create 20 notes with thematically related content but no shared keywords or wikilinks, open one of them, verify the Connections view surfaces at least three thematically related notes in its top five results — all computed using the local model with no internet connection.

**Acceptance Scenarios**:

1. **Given** the vault has been indexed and the user switches to a note, **When** the Connections view is open, **Then** the panel updates to show that note’s semantically related notes ranked by similarity score, with no keyword search required.
2. **Given** a note shares no keywords or wikilinks with related notes, **When** the Connections view renders, **Then** at least one thematically related note appears in the top results.
3. **Given** the user opens the Lookup view and types a natural language query, **When** results appear, **Then** notes are ranked by semantic relevance to the query intent, not only by exact keyword matches.
4. **Given** the user drags a connection entry into an open editor, **When** the drag completes, **Then** a wikilink to that note is inserted at the cursor position.
5. **Given** the user pins a connection, **When** the active note changes, **Then** the pinned note remains visible alongside the new note’s organic connections.
6. **Given** the user clicks “Copy connections as links”, **When** the command runs, **Then** a formatted list of wikilinks to all visible connections is copied to the clipboard.
7. **Given** a folder path is added to the embedding exclusion list, **When** the index updates, **Then** notes from that path produce no connections and do not appear as connection targets.
8. **Given** Bismuth is running with no network access, **When** the Connections view generates results, **Then** all similarity computations complete using the bundled local model with no error or degraded experience.

---

### User Story 9 — Canvas *(Group E: Visual & Spatial)* (Priority: P4)

A user opens or creates a canvas file (`.canvas`) in the vault. On an infinite zoomable surface they can drag in existing notes as file nodes, create free-standing text and image nodes, and draw directed edges between them with configurable styles (dotted, dashed, solid; multiple arrow-head types; floating or fixed attachment points). Nodes auto-resize to content, support flowchart shapes and border styles, and can be organised into collapsible groups. The user can enter Presentation Mode to navigate nodes as slides, embed one canvas inside another via Portals, and export the canvas as PNG or SVG. Canvas files integrate with the Bismuth graph view, outgoing links, and backlinks just like markdown notes.

**Why this priority**: The canvas is a spatial thinking layer distinct from the linear markdown editor and graph view. It enables diagramming, planning boards, and visual note-linking that the other surfaces cannot replace.

**Independent Test**: A user can create a canvas file, add two note nodes and one text node, draw a directed edge between the note nodes, and save — then reopen the file and find all three nodes and the edge intact.

**Acceptance Scenarios**:

1. **Given** a canvas with two file nodes, **When** the user draws an edge and sets it to dashed with a reverse arrow, **Then** the canvas saves and reloads the style correctly.
2. **Given** a node containing a long note, **When** auto-resize is enabled, **Then** the node height adjusts to show the full content without manual dragging.
3. **Given** the user selects a group of nodes and triggers Encapsulate Selection, **Then** those nodes move to a new canvas file and a portal node linking back to it appears in the original canvas.
4. **Given** Presentation Mode is active, **When** the user presses the next-slide key, **Then** the view animates to the next node in the defined sequence.
5. **Given** a canvas file has frontmatter `type: Project`, **When** the graph view is open, **Then** the canvas appears as a node with outgoing edges to all file nodes it contains.
6. **Given** the user exports the canvas as PNG, **When** the export completes, **Then** the file is saved locally with correct dimensions and optional transparent background.
7. **Given** a node is selected, **When** the user activates Focus Mode, **Then** all other nodes and edges are visually dimmed.

---

### User Story 10 — Local REST API & MCP Server *(Group H: Integration & Automation)* (Priority: P3)

A script, browser extension, or AI agent authenticates with a locally-running Bismuth API server using an API key and gains full programmatic access to the vault. It can read, create, update, and delete any file (including binary files), surgically patch a specific heading, block reference, or frontmatter key within a note (append, prepend, or replace that section without touching the rest), run full-text or structured metadata queries, read or write the file currently open in the Bismuth UI, create or retrieve periodic notes (daily, weekly, monthly, quarterly, yearly), trigger any registered Bismuth command as if from the command palette, list all tags with usage counts, and instruct Bismuth to open a specific note in the UI. An MCP server exposes the identical capability set to AI agents that speak the Model Context Protocol. Other plugins can register additional routes via an API extension interface.

**Why this priority**: A well-defined local API turns Bismuth into a programmable platform. AI agents, automation scripts, and browser extensions can interact with the vault without a GUI, which multiplies the value of every other feature.

**Independent Test**: A script authenticates with the API key, creates a new note via `POST /vault/notes`, reads it back via `GET /vault/notes/<path>`, patches a frontmatter key via `PATCH`, and deletes it via `DELETE` — all verified by automated HTTP integration tests without opening the Bismuth UI.

**Acceptance Scenarios**:

1. **Given** a request without a valid API key, **When** any API endpoint is called, **Then** the server returns HTTP 401 and no vault data is exposed.
2. **Given** a valid API key, **When** a `POST /vault/notes` request is sent with content, **Then** the file is created in the vault and immediately visible in the Bismuth UI.
3. **Given** a note with multiple headings, **When** a `PATCH` request targets a specific heading with `append` mode, **Then** only the content under that heading is modified; all other sections remain byte-for-byte identical.
4. **Given** a `GET /vault/active` request, **When** a note is open in the Bismuth editor, **Then** the response contains the full content and path of that note.
5. **Given** a `POST /periodic/daily` request, **When** a daily note template is configured, **Then** today's daily note is created (or returned if it already exists) using the configured template.
6. **Given** a `GET /tags` request, **When** the vault contains tagged notes, **Then** the response lists every tag with its usage count across the vault.
7. **Given** an MCP-compatible AI agent connects to the MCP server, **When** it requests vault file creation, **Then** the operation succeeds with the same semantics as the equivalent REST endpoint.
8. **Given** a plugin registers a custom API route, **When** a request is made to that route, **Then** the plugin's handler is invoked and the response is returned to the caller.
9. **Given** a structured JsonLogic query against note metadata, **When** sent to the search endpoint, **Then** only notes matching all specified frontmatter, tag, path, and content predicates are returned.

---

### User Story 11 — Capture & Lifecycle Dashboard *(Group B: Knowledge & Lifecycle)* (Priority: P2)

A user opens the Capture Dashboard — a dedicated inbox view — and sees every note whose lifecycle state is `captured` (unclassified). For each item they can read a snippet, assign a Portent type, set the lifecycle state (`captured`, `organized`, `archived`), attach a `belongs_to` parent entity, add `related_to` connections, and dismiss or delete the note — all without leaving the dashboard. A keyboard shortcut anywhere in Bismuth creates a new blank captured note instantly and drops it into the inbox. Web content can be clipped directly into the vault inbox from a browser using the REST API (US10), making the inbox the single landing zone for all raw captures. The dashboard shows counts per lifecycle state and supports batch classification of multiple notes at once. Archived notes are hidden from active vault views by default but remain searchable.

**Why this priority**: Capturing is frictionless; processing is where knowledge systems fail. Without a triage layer the Portent entity system (US3) fills with unclassified noise that degrades the graph and search results.

**Independent Test**: With ten notes in `captured` state, the dashboard lists all ten, a user assigns a type and `belongs_to` to one, advances its state to `organized`, and the note disappears from the inbox — verifiable without any other feature active.

**Acceptance Scenarios**:

1. **Given** a note has no `organized` or `archived` flag in frontmatter, **When** the Capture Dashboard opens, **Then** that note appears in the inbox list with its title, creation date, and a preview snippet.
2. **Given** a note is displayed in the inbox, **When** the user assigns a Portent type and sets state to `organized`, **Then** the frontmatter is updated atomically and the note is removed from the inbox without a page reload.
3. **Given** the user presses the quick-capture shortcut, **When** Bismuth is in any view, **Then** a new note with `organized: false` and `archived: false` in frontmatter is created and the cursor is placed in the note body within 200 ms.
4. **Given** a `POST /vault/notes` REST API request includes `organized: false` in frontmatter, **When** the dashboard is open, **Then** the new note appears in the inbox in real time without requiring a manual refresh.
5. **Given** the user selects multiple inbox notes and applies a batch classify action, **When** confirmed, **Then** all selected notes receive the chosen type and lifecycle state atomically.
6. **Given** a note is set to `archived: true`, **When** the main file tree and graph view are active, **Then** the note is hidden from those views but is returned by search and directly accessible via its path.
7. **Given** the dashboard is open, **When** the user filters by lifecycle state, **Then** only notes in that state are shown and the count badge updates.

---

### User Story 12 — Template Engine *(Group B: Knowledge & Lifecycle)* (Priority: P2)

A user creates a template file in the vault's `templates/` folder using Bismuth's template syntax (`<% ... %>` delimiters). The template can embed built-in expressions — file metadata (`tp.file.title`, `tp.file.creation_date()`), date/time functions (`tp.date.now("YYYY-MM-DD", offset)`), vault functions (e.g., generate a wikilink to yesterday's daily note), and Portent frontmatter stubs for any entity type. It can also contain inline JavaScript blocks that execute at insertion time to compute dynamic values. When a user creates a new note or inserts a template into an existing note, Bismuth presents a template picker, resolves all expressions, executes any JavaScript blocks in a sandboxed runtime, and inserts the rendered result. Templates can be scoped to a folder (auto-suggested when creating a note there) or to a Portent type (auto-applied when a type is assigned in the Capture Dashboard). Users can also define their own reusable JavaScript helper functions stored in the vault's template helpers directory.

**Why this priority**: Consistent note structure and automated frontmatter generation are table-stakes for a PKM system. Without a template engine, users manually reproduce boilerplate on every note, which leads to inconsistency and slows capture.

**Independent Test**: A template file containing `# <% tp.file.title %>` and `creation date: <% tp.file.creation_date() %>` is inserted into a new note; the rendered note contains the correct title and ISO creation timestamp with no unresolved tokens.

**Acceptance Scenarios**:

1. **Given** a template file with `<% tp.file.title %>`, **When** the template is inserted into a new note named "Meeting Notes", **Then** the rendered note contains `# Meeting Notes` with no residual template syntax.
2. **Given** a template with `<% tp.date.now("YYYY-MM-DD", -1) %>`, **When** inserted, **Then** the token resolves to yesterday's date in the specified format.
3. **Given** a template with an inline JavaScript block that computes a value, **When** inserted, **Then** the block executes in a sandboxed environment and its return value replaces the token; the sandbox MUST NOT have access to the filesystem outside the vault or to network APIs.
4. **Given** a folder has a folder-scoped template configured, **When** a new note is created in that folder, **Then** Bismuth automatically applies the template without requiring the user to open the template picker.
5. **Given** the user opens the template picker, **When** they search by name, **Then** the list filters in real time and keyboard navigation selects and inserts the template.
6. **Given** a Portent type template exists for `type: Event`, **When** a note is assigned the `Event` type in the Capture Dashboard, **Then** Bismuth offers to apply the Event template to pre-populate frontmatter fields (`belongs_to`, `related_to`, `organized`, `archived`).
7. **Given** a template references a custom JavaScript helper defined in the helpers directory, **When** the template is inserted, **Then** the helper is resolved and executed correctly.
8. **Given** a template contains a syntax error, **When** it is inserted, **Then** Bismuth reports the error inline with the line and token that failed, and inserts nothing, leaving the note unchanged.

---

### User Story 13 — Content Consumption: Feeds & RSVP Speed Reader *(Group G: Content Consumption)* (Priority: P5)

A user opens the Feed Dashboard and adds subscriptions by pasting a URL — Bismuth auto-detects whether it is an RSS/Atom/JSON feed, a YouTube channel (converted to its RSS feed without an API key), or a podcast feed. All feeds are organized into user-defined folders and tagged; articles are displayed in a paginated list sortable by date and filterable by read status, starred, saved, or age. Clicking an article opens a built-in reader that fetches the full article body and renders it as formatted text. From the reader or the list, the user can save the article directly as a vault note using a customizable save template (integrating with the Template Engine from US12) that populates frontmatter fields such as `title`, `url`, `published`, `feed`, and `tags`. Saved articles land in the vault as `captured` notes, feeding directly into the Capture Dashboard (US11). Feeds auto-refresh on a configurable schedule. The user can import and export their subscription list in OPML format.

**Why this priority**: The feed dashboard closes the capture loop — web knowledge flows directly into the vault without copy-paste, and saved articles automatically enter the Portent lifecycle triage system.

**Independent Test**: A user adds a valid RSS feed URL, sees its articles listed in the dashboard, opens one in the reader, and saves it as a vault note — verifiable with a publicly accessible RSS feed and no other Bismuth feature active.

**Acceptance Scenarios**:

1. **Given** the user pastes a URL, **When** Bismuth fetches it and detects a valid RSS, Atom, or JSON feed, **Then** the feed is added to the dashboard and its articles are listed within 5 seconds on a standard connection.
2. **Given** the user pastes a YouTube channel URL, **When** Bismuth converts it to the channel's public RSS feed URL, **Then** video entries appear in the feed list with title, thumbnail, and published date without requiring a YouTube API key.
3. **Given** an article is selected in the feed list, **When** the user opens the reader view, **Then** the full article body is fetched, converted to Markdown, and displayed within 5 seconds; if fetching fails, the feed summary is shown with an error notice.
4. **Given** the user triggers Save Article, **When** a save template is configured, **Then** a new note is created in the vault with the template rendered (title, URL, published date, feed name, tags) and lifecycle state `captured`, making it immediately visible in the Capture Dashboard.
5. **Given** auto-refresh is enabled with a 30-minute interval, **When** the interval elapses, **Then** all subscribed feeds are re-fetched in the background without interrupting the user's current view.
6. **Given** the user applies a filter for unread articles in a specific folder, **When** the filter is active, **Then** only unread articles from feeds in that folder are displayed and the count badge reflects the filtered total.
7. **Given** the user exports subscriptions, **When** the OPML export completes, **Then** the file contains all subscribed feed URLs, titles, and folder structure in valid OPML format.
8. **Given** the user imports an OPML file, **When** import completes, **Then** all feeds in the file are added to the dashboard preserving folder structure, and duplicate feed URLs are skipped with a notice.

**RSVP Speed Reader** *(companion feature; scenarios 9–12 supersede the separate US21 story block)*

9. **Given** the user runs "Start speed reading" on a note or text selection, **When** the RSVP overlay opens, **Then** all YAML frontmatter, markdown syntax tokens, code fences, and HTML comments are stripped; only readable prose tokens are presented one word at a time.
10. **Given** a word is displayed, **When** ORP highlighting renders, **Then** the letter at approximately 30% into the word appears in the configured ORP color; natural pacing extends display time for punctuation-ending tokens and tokens longer than 8 characters.
11. **Given** the reader is playing, **When** the user presses `←` or `→`, **Then** reading skips exactly 10 tokens in the respective direction; pressing `↑` or `↓` adjusts WPM by 25 (min 60, max 1 000); pressing `F` toggles focus mode showing only the current word with all controls hidden.
12. **Given** the user presses `Escape`, **When** the overlay closes, **Then** keyboard focus returns to the editor and the note body is unchanged.

---

### User Story 14 — Typing Enhancements & Rule Engine *(Group D: Content Authoring)* (Priority: P3)

As a user types in the Bismuth editor, a set of smart formatting behaviors activate automatically: sentences are auto-capitalized, CJK characters are automatically spaced from adjacent Latin or numeric text, full-width punctuation is inserted after CJK characters without mode switching, paired brackets and quotes are auto-closed with tab-out support, and `··` (two middle dots) produces an inline code span. A smart Backspace clears empty list items and quote lines in one keystroke, and Smart Paste preserves list and quote prefix context. All auto-formatting is immediately undoable. Users can also invoke Format Article (`Mod+Shift+S`) or Format Selection (`Mod+Shift+L`) to apply spacing rules to existing content. Beyond the built-in behaviors, a Rule Engine lets users define custom text transformations of three types: `Input` (triggered when a pattern is typed), `Delete` (triggered on Backspace), and `SelectKey` (triggered when text is selected then a key is pressed). Rules support regex with capture groups, tabstop placeholders (`$0`, `$1`, `${1:default}`) with Tab navigation, scope-aware execution (text, formula, code contexts), JavaScript function replacements, priority ordering, and JSON import/export.

**Why this priority**: Typing friction compounds over thousands of notes. Auto-formatting and a rule engine let users encode their own typographic conventions once and have them applied everywhere, making Bismuth faster to write in than a plain editor.

**Independent Test**: With auto-formatting enabled, a user types a mixed Chinese-English sentence and CJK-to-Latin spacing is inserted automatically; typing `··` produces an inline code span; pressing Backspace on an empty list item removes the list marker — all verifiable in the editor with no other features active.

**Acceptance Scenarios**:

1. **Given** auto-formatting is enabled, **When** a user types `今天I` (Chinese character followed directly by Latin), **Then** a space is automatically inserted between the CJK and Latin characters without the user pressing Space.
2. **Given** the user types `··` (two middle dots), **When** auto-formatting is active, **Then** the two dots are replaced by an inline code span with the cursor positioned inside it.
3. **Given** the cursor is inside a paired bracket or quote, **When** the user presses Tab, **Then** the cursor jumps to just after the closing symbol (tabout).
4. **Given** the user presses Backspace on an empty list item or empty blockquote line, **When** smart Backspace is active, **Then** the empty marker is removed and the cursor moves to the previous line in one keystroke.
5. **Given** an `Input` rule matching `->` is defined with replacement `→`, **When** the user types `->`, **Then** the two characters are replaced with `→` immediately.
6. **Given** a `SelectKey` rule matching selection + `$` is defined, **When** the user selects text and types `$`, **Then** the selection is wrapped in `$...$` with the cursor placed after the closing `$`.
7. **Given** a rule with a tabstop placeholder `${1:default}`, **When** the rule fires, **Then** `default` is selected and the user can Tab through subsequent tabstops.
8. **Given** the user invokes Format Article (`Mod+Shift+S`), **When** the command runs, **Then** all auto-spacing rules are applied to the entire document and the result is undoable in one `Ctrl/Cmd+Z`.
9. **Given** a file is in the exclusion list by path pattern, **When** auto-formatting events occur in that file, **Then** no formatting is applied.

---

### User Story 28 — Rich Editing Toolbar *(Group D: Content Authoring)* (Priority: P2)

A user opens any note in the Bismuth editor and interacts with text formatting through a configurable rich toolbar that behaves like a word processor. The toolbar supports three display modes: **top** (fixed bar above the editor), **following** (a floating popover that tracks the cursor or active selection), and **tiny** (a compact strip that minimises screen real estate). The toolbar hosts a fully customizable set of command slots: built-in commands for inline formatting (bold, italic, underline, strikethrough, inline code), font color with color picker, background/highlight color with color picker, text alignment (left, centre, right, justify), list indent/undent, undo/redo, horizontal rule, and headings H1–H6 (default shortcuts Ctrl+1 through Ctrl+6), plus any registered Bismuth command. Slots are drag-and-drop reorderable, support custom display icons and names, and can be grouped into submenus. A **formatting brush** captures the font color or background color from the current selection and applies it to subsequent selections until cancelled by right-click or middle-click. The toolbar adapts its icon widths to the available container width so all slots remain visible on a single row with no overflow. Two companion **focus modes** are activatable from the toolbar: fullscreen focus (Ctrl+Shift+F11) expands the editor to fill the display hiding all panels, and workspace fullscreen focus (Ctrl+F11) hides the navigator and sidebar panels only. The toolbar functions identically in popout windows and across multiple tabs.

**Why this priority**: A configurable formatting toolbar removes the need to memorise markdown syntax or keyboard shortcuts for common formatting, making Bismuth accessible to writers who expect a word-processor experience and reducing friction during active writing sessions.

**Independent Test**: Set toolbar to following mode, select text, verify the toolbar floats near the selection; apply a font color via the picker; activate the formatting brush and apply the same color to a second selection; drag a slot to a new position, restart, verify the order persists.

**Acceptance Scenarios**:

1. **Given** the toolbar is in top mode, **When** any note is open, **Then** a persistent formatting bar appears above the editor canvas with icon buttons for all configured slots.
2. **Given** the toolbar is in following mode, **When** the user places their cursor or makes a selection, **Then** the toolbar floats near the cursor/selection; it hides when focus leaves the editor.
3. **Given** the user selects text and activates the font color command, **When** a color is chosen from the picker, **Then** the selected text is wrapped with the chosen inline color styling.
4. **Given** the user activates the formatting brush for font color, **When** they select a different text range, **Then** that range receives the same color; right-clicking or middle-clicking anywhere deactivates the brush.
5. **Given** the user drags a command slot to a new position, **When** the drag completes, **Then** the toolbar shows the new slot order and the layout persists across sessions.
6. **Given** the user adds a submenu group to a toolbar slot, **When** the slot is clicked, **Then** a nested dropdown of the assigned sub-commands appears and each is directly executable.
7. **Given** the user triggers fullscreen focus (Ctrl+Shift+F11), **When** the command fires, **Then** the editor fills the display with all panels hidden; pressing Escape or re-triggering restores the previous layout.
8. **Given** the toolbar contains more icons than the available pane width at standard size, **When** the toolbar renders, **Then** icon widths scale down proportionally so all slots remain on a single row without overflow or wrapping.

---

### User Story 29 — Typewriter Mode & Focus Writing *(Group D: Content Authoring)* (Priority: P3)

A user enables Typewriter Mode from settings or via a command, transforming the Bismuth editor into a distraction-free writing environment. When active, the editor keeps the cursor line anchored at a configurable fixed vertical position on screen (default: centre) so the text the user is writing never drifts to the bottom of the view — the page scrolls around the cursor rather than the cursor chasing the page. A highlighted band marks the active line, making it instantly clear where the next character will appear. The user can also enable **paragraph dimming** (only the paragraph containing the cursor is rendered at full opacity; all others fade) or **sentence dimming** (only the active sentence is full-brightness) to sharpen focus further. A configurable **line-length limit** constrains the prose column to a set character width and centres it horizontally in the pane, reducing the eye-travel distance on wide monitors. On reopening any note Bismuth restores the cursor to the exact line and column where it was when the file was last closed. Finally, **Hemingway mode** disables all backwards editing — Backspace, Delete, and cut operations are silently ignored; paste is only permitted at the end of the current content — forcing the user to write forwards without self-interrupting revision. Each feature is independently togglable so the user can mix and match to build their ideal focus stack.

**Why this priority**: Long-form writers and researchers lose flow when the editor feels like a file manager rather than a writing instrument. Typewriter scrolling, paragraph dimming, and Hemingway mode are high-leverage focus tools that require no new data model but substantially reduce distraction during composition.

**Independent Test**: Enable typewriter scrolling and paragraph dimming, open a 500-word note, type several lines — verify the cursor stays at the configured screen position and only the active paragraph is full-brightness; enable Hemingway mode and press Backspace — verify the character is not deleted.

**Acceptance Scenarios**:

1. **Given** typewriter scrolling is enabled at 50% (centre), **When** the user types and the cursor advances, **Then** the viewport scrolls so the cursor line remains at the vertical midpoint of the editor; the position is maintained even when the cursor moves between lines with arrow keys.
2. **Given** current line highlighting is enabled, **When** the user moves the cursor to a different line, **Then** only the line containing the cursor is visually highlighted; all other lines are unaffected.
3. **Given** paragraph dimming is active, **When** the cursor is inside a paragraph, **Then** all other paragraphs are rendered at the configured reduced opacity; moving the cursor to a different paragraph shifts the highlight immediately with no perceptible delay.
4. **Given** sentence dimming is active, **When** the cursor is inside a sentence, **Then** all other sentences in the note are dimmed to the configured opacity; crossing a sentence boundary updates the highlight in real time.
5. **Given** a maximum line length is configured (e.g., 80 characters), **When** the editor renders, **Then** the prose column is constrained to that width and is horizontally centred within the available pane; the margin areas on each side are empty and not interactive.
6. **Given** the user closes a note with the cursor at a specific line and column, **When** the note is reopened, **Then** the cursor is restored to that exact position and the editor scrolls to make it visible.
7. **Given** Hemingway mode is enabled, **When** the user presses Backspace or Delete, **Then** the action is silently ignored and no characters are removed; paste operations are only permitted when the cursor is at the end of the current content.
8. **Given** Typewriter Mode features are enabled, **When** the editor is in a popout window or a split pane, **Then** each editor instance maintains its own independent typewriter state without interfering with other open panes.

---

### User Story 30 — LaTeX Math Suite *(Group D: Content Authoring)* (Priority: P3)

A user writing mathematical notation opens an inline math block (`$...$`) or display math block (`$$...$$`) and immediately benefits from a set of typesetting acceleration features. A built-in snippet library covers the most common shorthands — Greek letters (`@a` → `\alpha`), fractions (`x/y` → `\frac{x}{y}`), superscripts, subscripts, integrals, common functions, and more — and can be fully extended with user-defined snippets. Each snippet has a trigger (plain text or regex), a replacement (plain text or JavaScript function), a set of mode options (text, inline math, block math, auto-expand, visual/selection, word-boundary, code), an optional ordered set of tabstops (`$0`, `$1`, ...), a priority for conflict resolution, and an optional description. **Auto-fraction** converts any `numerator/denominator` sequence (including expressions with nested parentheses) to `\frac{...}{...}` and positions the cursor in the denominator; Tab advances to after the closing brace. Inside matrix environments (`matrix`, `align`, `cases`, etc.) Tab inserts `&`, Enter inserts `\\` and starts a new row, and Shift+Enter jumps to the end of the next line. **Conceal mode** hides raw LaTeX markup in Live Preview and renders symbolic equivalents (e.g., `\sqrt{1-\beta^{2}}` → `√{1-β²}`); moving the cursor into a concealed expression reveals its raw form, with an optional configurable delay for arrow-key navigation comfort. Tab-navigation moves the cursor out of a `$...$` block, through `\left...\right` pairs, or to the next closing bracket. An **inline math preview** popover renders the typeset output of the math block the cursor is currently inside. **Visual snippets** let the user select an expression and press a single key to wrap it with `\underbrace`, `\overbrace`, `\cancel`, `\cancelto`, or `\underset`. **Auto-enlarge brackets** upgrades plain parentheses to `\left(...)\right)` whenever a fraction, integral, or sum snippet fires inside them. Matching brackets are color-coded by nesting depth and highlighted when the cursor is adjacent or inside them. Two command-palette commands let the user box (`\boxed{...}`) or select the equation at the cursor.

**Why this priority**: Research notes, academic writing, and STEM workflows require mathematical notation. Without acceleration tools the user types verbose LaTeX commands character-by-character, breaking flow. This story completes Bismuth’s authoring stack for scientific and academic users and differentiates it from general-purpose note apps.

**Independent Test**: Enter display math mode with `dm`, type `@a` and verify `\alpha` appears immediately; type `x/y Tab` and verify `\frac{x}{y}` with cursor exit; enter a matrix and verify Tab inserts `&`; enable Conceal and verify `\sqrt{x}` displays as `√{x}` with raw LaTeX revealed on cursor entry.

**Acceptance Scenarios**:

1. **Given** an auto-snippet `@a → \alpha` with option `mA`, **When** the user types `@a` inside any math block, **Then** `@a` is immediately replaced with `\alpha` without pressing Tab; outside math the trigger has no effect.
2. **Given** the user types `x/y` inside a math block, **When** auto-fraction fires, **Then** the expression becomes `\frac{x}{}` with the cursor inside the denominator braces; pressing Tab exits to after the closing brace.
3. **Given** the cursor is inside a `\begin{align}...\end{align}` block, **When** the user presses Tab, **Then** `&` is inserted; pressing Enter inserts `\\\\` and a new row; pressing Shift+Enter moves the cursor to the end of the following row.
4. **Given** Conceal mode is enabled and the editor contains `\sqrt{1-\beta^{2}}`, **When** the block renders in Live Preview, **Then** it displays as `√{1-β²}`; moving the cursor into the expression reveals the raw LaTeX markup.
5. **Given** the cursor is at the end of an inline math expression `$x^{2}$`, **When** the user presses Tab, **Then** the cursor moves to after the closing `$` symbol.
6. **Given** the user selects a math sub-expression and presses `U`, **When** the visual snippet fires, **Then** the selection is wrapped as `\underbrace{selection}{}` with the cursor positioned in the annotation argument.
7. **Given** a fraction snippet fires inside plain parentheses `(...)`, **When** auto-enlarge activates, **Then** the parentheses are upgraded to `\left( \right)` around the entire fraction without manual editing.
8. **Given** the user positions the cursor adjacent to an opening bracket inside a math block, **When** the editor renders, **Then** that bracket and its closing pair are highlighted and displayed in the same nesting-level color, distinct from brackets at other depths.

---

### User Story 15 — Notebook Navigator *(Group C: Workspace & Navigation)* (Priority: P1)

The standard file tree is replaced by a two-pane Navigator. The left navigation pane displays a folder tree, tag tree, and property browser in tabs; the right list pane displays the files within the selected folder, tag, or property value. Both panes are fully keyboard-navigable with configurable hotkeys including Vim-style bindings. The user can switch between single-pane and dual-pane layout with a command, resize panes, and toggle horizontal or vertical split orientation. Notes display up to five preview lines, an optional featured-image thumbnail, modification date, and frontmatter properties. The user can pin notes to the top of any folder or tag view, assign colors and Lucide/emoji icons to folders, tags, and individual files, and hide folders, tags, or notes by pattern or frontmatter property. Vault profiles let the user maintain multiple filtered views (e.g. one profile per project) each with their own hidden content, shortcuts, and banner. A shortcut bar holds up to nine pinnable entries (notes, folders, tags, saved searches) accessible by keyboard. A calendar panel shows daily-note history with day selection. Drag-and-drop moves files between folders, reparents tags, and assigns shortcuts. File operations — create, rename, duplicate, move, merge, trash, convert to folder note — are all context-menu and command-accessible from within the Navigator, always scoped to the currently selected folder or tag.

**Why this priority**: Navigation is the most-used surface in a PKM. A powerful, keyboard-first two-pane browser reduces friction for every other feature and is the primary entry point to the vault.

**Independent Test**: A user opens the Navigator, expands a folder in the navigation pane, selects a note in the list pane using only the keyboard, pins it, assigns it a color, and creates a new note in the same folder — all without touching the mouse.

**Acceptance Scenarios**:

1. **Given** the Navigator is open in dual-pane layout, **When** the user presses `→` in the navigation pane, **Then** focus moves to the list pane; pressing `←` in the list pane returns focus to the navigation pane.
2. **Given** the user types a filter search query `#work .status=active @thisweek`, **When** the query is applied, **Then** only notes matching all three predicates (tag, property, and date) are shown in the list pane.
3. **Given** a note is pinned in a folder view, **When** the folder is opened, **Then** the pinned note appears at the top of the list regardless of the active sort order.
4. **Given** the user assigns a color and a Lucide icon to a folder, **When** the folder tree renders, **Then** the folder displays the assigned icon and color in all views that reference it.
5. **Given** a vault profile is selected, **When** the Navigator renders, **Then** only the folders, tags, and notes permitted by that profile’s hidden-content configuration are visible; switching profiles reloads the view without restart.
6. **Given** the user drag-and-drops a note from one folder to another, **When** the drop completes, **Then** the file is moved on disk, all wikilinks to it are updated (via FR-005), and the list pane scrolls to the note in its new location.
7. **Given** the user selects multiple notes with `Cmd/Ctrl+Click` and invokes Merge Notes, **When** merge completes, **Then** a single new note is created containing the content of all selected notes in list order, and the originals are moved to trash.
8. **Given** the user converts a note to a folder note, **When** the command runs, **Then** a folder matching the note’s name is created, the note is moved inside it and renamed to the folder-note name, and the folder tree updates immediately.
9. **Given** the calendar panel is open, **When** the user clicks a past day, **Then** the daily note for that day opens (or is created from the configured template if it does not exist).
10. **Given** the user types a shortcut key (e.g. `Cmd+Shift+1`), **When** shortcut slot 1 contains a saved search, **Then** the Navigator switches to the saved search result view immediately.

---

### User Story 16 — Note Sequencer *(Group F: Long-form Creative)* (Priority: P4)

A user opens a note and runs "Insert note after current note" from the command palette. A note picker opens; the user selects an existing note or types a new name to create one. Bismuth writes `next: "[[Chosen Note]]"` into the current note's frontmatter and `prev: "[[Current Note]]"` into the chosen note's frontmatter, keeping both sides in sync. Previous and next arrow buttons appear in the note header whenever a note has either property; clicking an arrow opens the linked note, and `Cmd/Ctrl`-clicking opens it in a new tab. The user can insert before, remove from sequence without deleting the file, or delete and reconnect in one command. When any note with sequence links is deleted from the vault (by any means), Bismuth automatically reconnects the neighboring notes so no chain is left dangling. All sequence data is stored in plain YAML frontmatter — notes remain normal markdown files and sequences are hand-editable.

**Why this priority**: Sequences give linear structure to any ordered collection (lessons, chapters, project logs, reading lists) that wikilinks alone cannot express. Storing the order in frontmatter keeps it portable and human-readable.

**Independent Test**: Three notes A, B, C — insert B after A, then insert C after B. Verify A has `next: [[B]]`, B has `prev: [[A]]` and `next: [[C]]`, C has `prev: [[B]]`, and the arrow buttons navigate correctly in both directions.

**Acceptance Scenarios**:

1. **Given** the user runs "Insert note after current note" and picks note B, **When** B is inserted after A, **Then** A gains `next: "[[B]]"` and B gains `prev: "[[A]]"` atomically; if B already had a `prev`, it is overwritten and the old predecessor's `next` is cleared.
2. **Given** a note has a `prev` or `next` property, **When** the note is open in the editor, **Then** previous and next arrow buttons are visible in the note header; clicking one opens the linked note and `Cmd/Ctrl`-clicking opens it in a new tab.
3. **Given** the user runs "Remove current note from sequence" on note B in chain A↔B↔C, **When** the command completes, **Then** B's `prev` and `next` are cleared, A gains `next: "[[C]]"`, and C gains `prev: "[[A]]"` — the chain reconnects without deleting B.
4. **Given** the user runs "Delete current note from sequence" on note B, **When** confirmed, **Then** B is moved to trash and A↔C are reconnected; if confirmation is disabled the operation runs immediately.
5. **Given** a note with `next: "[[B]]"` is deleted by any means (Navigator, OS, external editor), **When** the deletion is detected, **Then** the neighboring notes are automatically reconnected without user intervention.
6. **Given** the note picker has "Only show sibling notes" enabled, **When** the picker opens, **Then** only notes in the same folder as the current note are suggested.
7. **Given** a `prev` or `next` property points to a note that cannot be resolved, **When** the corresponding arrow is clicked, **Then** a non-blocking notice is shown and the editor does not navigate.

---

### User Story 17 — Vertical Tabs & Tab Management *(Group C: Workspace & Navigation)* (Priority: P3)

Instead of a horizontal strip that narrows as more files open, Bismuth displays open tabs in a vertical sidebar list showing full file names. Tabs can be manually reordered by drag-and-drop or sorted automatically by name, pin state, or recent activity; the vertical and any horizontal representation stay in sync. Tabs are organized into named tab groups, each switchable between four views: default (one tab at a time), continuous (all tabs as a scrollable document), column (tabs side by side), and Mission Control (visual thumbnail grid). Groups can be collapsed, hidden, renamed, and colored. Zen Mode hides all tabs and groups except the active one. Per-tab zoom lets individual tabs have independent zoom levels without affecting the rest of the UI. A tab history browser on right-click shows the full navigation history for each tab with browse, bookmark, and clear actions. An enhanced keyboard switcher offsets the `Cmd/Ctrl+1–8` index window to reach beyond the first eight tabs without touching the mouse. Smart Navigation ensures new tabs open in the same group as the originating tab. Ephemeral tabs (shown in italic) auto-replace on next open and close on navigate-away. Tab deduplication redirects to an existing open tab rather than creating a duplicate.

**Why this priority**: A PKM accumulates many open notes during a research session. Without structured tab management the horizontal tab strip collapses to unreadable widths, forcing mouse-dependent navigation that breaks flow.

**Independent Test**: A user opens eight notes, drags them into two named groups, enables Zen Mode to focus on one, then uses `Cmd/Ctrl+→` to shift the keyboard index window and reaches note 9 with `Cmd/Ctrl+1` — entirely keyboard-driven.

**Acceptance Scenarios**:

1. **Given** more than one note is open, **When** the vertical tab sidebar is visible, **Then** each open tab is listed with its full file name and the active tab is visually highlighted; the list and any horizontal tab strip remain in sync.
2. **Given** the user drags a tab into a different tab group, **When** the drop completes, **Then** the tab appears in the target group and the workspace layout updates without restart.
3. **Given** a tab group is set to Continuous view, **When** the view renders, **Then** all notes in the group are displayed as a single scrollable document with visible dividers between files.
4. **Given** Zen Mode is activated, **When** the view renders, **Then** all tab groups except the one containing the active note are hidden; deactivating Zen Mode restores all groups.
5. **Given** per-tab zoom is enabled and the user zooms in on one tab, **When** switching to another tab, **Then** the second tab retains its own zoom level and the first tab’s zoom is unchanged.
6. **Given** nine or more tabs are open and the user presses `Cmd/Ctrl+→`, **When** the index window shifts, **Then** `Cmd/Ctrl+1` activates the ninth tab and the vertical list scrolls to keep the indexed range visible.
7. **Given** Smart Navigation is enabled and the user opens a link from tab group A, **When** the linked note opens, **Then** it opens as a new tab within group A, not in a different group or a new split.
8. **Given** an Ephemeral tab is open and the user opens a different note, **When** the new note loads, **Then** the ephemeral tab is replaced by the new note rather than creating a second tab.
9. **Given** Tab Deduplication is enabled and the user opens a note that is already open in another tab, **When** the open action fires, **Then** focus moves to the existing tab rather than creating a duplicate.
10. **Given** the user right-clicks a vertical tab, **When** the context menu opens, **Then** the full navigation history for that tab is accessible with options to navigate to any entry, bookmark it, or clear the history.

---

### User Story 26 — Recent Files Sidebar *(Group C: Workspace & Navigation)* (Priority: P3)

A user opens a dedicated "Recent Files" sidebar panel that lists the most recently opened vault notes in reverse-chronological order, newest at the top. Entries behave exactly like items in the file explorer: clicking opens the note, Ctrl/Cmd+clicking opens it in a new pane, and right-clicking reveals the full context menu (rename, move, delete, copy path, etc.). Files can be dragged from the panel to an open editor to insert a wikilink at the drop point, to a pane header to open in that pane, or to a file explorer folder to move the file on disk. Hovering (or Ctrl+hovering depending on Page Preview settings) shows a content preview popover. The panel is configurable: the user sets a maximum entry count, excludes specific folder paths by glob pattern, excludes notes carrying certain frontmatter tags, and optionally suppresses bookmarked files from the list. If a note’s frontmatter provides a display title, the panel shows that title instead of the raw filename. The panel persists its list across sessions and updates in real time as notes are opened.

**Why this priority**: A recent-files panel is the fastest way to re-open a note from a prior session without traversing the folder tree or running a search. It reduces context-switching cost in rapid research and writing sessions and is a natural companion to the Notebook Navigator (US15) and Vertical Tabs (US17).

**Independent Test**: Open five notes in sequence, open the Recent Files sidebar — verify they appear newest-first with no duplicates; add a folder exclusion matching the second note — verify it disappears from the list without affecting the other four entries.

**Acceptance Scenarios**:

1. **Given** multiple notes have been opened in the current vault session, **When** the Recent Files panel renders, **Then** notes appear newest-first with no duplicates; the list updates in real time as additional notes are opened.
2. **Given** a folder path glob is added to the exclusion list, **When** any note inside that path is opened or already in the list, **Then** it does not appear in the Recent Files panel.
3. **Given** a note carries a frontmatter tag matching an excluded tag, **When** the panel renders, **Then** that note is absent from the list regardless of recency.
4. **Given** "Exclude bookmarked files" is enabled and a file is bookmarked, **When** the panel renders, **Then** that file is absent from the Recent Files list even if it was recently opened.
5. **Given** the user Ctrl/Cmd+clicks a recent file entry, **When** the note opens, **Then** it opens in a new pane without replacing the current active view.
6. **Given** the user drags a recent file entry to an open editor pane, **When** the drag completes, **Then** a wikilink to that file is inserted at the cursor position in the target editor.

---

### User Story 18 — Long-form Project & Draft Management *(Group F: Long-form Creative)* (Priority: P3)

A user creates a writing project by running "New Project" and filling in a title and target word count. Bismuth creates a project note with `bismuth-type: project` frontmatter. The user then creates scenes anywhere in the vault — folder location is irrelevant — each identified by `bismuth-type: scene` frontmatter carrying status, POV, synopsis, and an optional ordered position within the project. Sub-scenes nest within scenes using the same frontmatter mechanism. When the user is ready to version a scene’s prose, they run "New Draft": Bismuth snapshots the current prose into a dated draft file (`bismuth-type: draft`, `draft-of: [[Scene Title]]`, `draft-version: N`), creates a fresh working-draft file linked back to the original scene, and leaves all prior draft files intact as real markdown files openable in split panes for side-by-side comparison. A Manuscript Builder UI lets the user define named compile presets — selecting and ordering scenes, applying formatting rules, and choosing output formats (Markdown, ODT, PDF, DOCX). A Preview tab renders the preset’s output as continuous read-only prose and re-renders automatically on each save. The Builder can be docked as a persistent workspace tab alongside a scene being edited. A multi-step Scrivener 3 import wizard reads a `.scriv` bundle placed in the vault and produces a complete Draft Bench–style project: chapters, scenes, sub-scenes, optional versioned drafts, synopses, notes, comments, footnotes, keywords, and custom metadata as frontmatter.

**Why this priority**: Novel and screenwriting workflows require structures that flat note-taking cannot provide: ordered scenes, versioned prose history, and compiled manuscript output. Without this, Bismuth is unsuitable for serious long-form authors despite its otherwise strong markdown base.

**Independent Test**: A user creates a project with three scenes, writes prose in scene 2, runs "New Draft", opens the old draft alongside the new one in split panes, then builds a Markdown compile of all three scenes in order — verifiable with no other feature active.

**Acceptance Scenarios**:

1. **Given** the user runs "New Project", **When** they supply a title and target word count, **Then** a project note with `bismuth-type: project` frontmatter is created; a word-count progress bar is displayed and updates as scene word counts change.
2. **Given** a note has `bismuth-type: scene` and references a project in frontmatter, **When** the Manuscript Builder opens, **Then** the scene appears in the scene list for that project regardless of which folder it lives in.
3. **Given** the user runs "New Draft" on a scene, **When** the command executes, **Then** a snapshot file is created with `bismuth-type: draft`, `draft-of: [[Scene Title]]`, and `draft-version: N`; a new working-draft file is created; and the user is taken to the new working draft with cursor at the top.
4. **Given** two draft files exist for the same scene, **When** the user opens them in split panes, **Then** both render as normal markdown notes with no special mode required.
5. **Given** a compile preset is defined with three scenes in a specified order, **When** the user clicks Preview, **Then** the Manuscript Builder Preview tab renders all three scenes as a single continuous prose document, re-rendering automatically when any scene is saved.
6. **Given** the user triggers Export from the Manuscript Builder with DOCX selected, **When** the export completes, **Then** a valid `.docx` file is written to the vault’s configured output folder containing all scenes in preset order with applied formatting.
7. **Given** a scene has status `archived`, **When** the main Navigator and graph view render, **Then** the scene is hidden from active views by default (consistent with FR-061 archived visibility) but remains accessible by direct path and search.
8. **Given** a `.scriv` bundle is placed in the vault and the user runs the Scrivener Import wizard, **When** import completes, **Then** chapters, scenes, sub-scenes, synopses, notes, and custom metadata are present as Draft Bench–typed frontmatter notes in the vault; no RTF or binary content remains in the output notes.
9. **Given** the Manuscript Builder is docked as a workspace tab, **When** the user edits a scene in an adjacent tab and saves, **Then** the Preview tab re-renders within 2 seconds without the user manually triggering a refresh.

---

### User Story 19 — Branching Block Editor *(Group E: Visual & Spatial)* (Priority: P4)

A user opens any markdown note and runs "Open branching view". Bismuth renders the note as a left-to-right tree of markdown blocks. Each block is a discrete chunk of prose or structure; siblings appear vertically stacked in a column, children appear in the next column to the right. The user can see the active branch and its alternatives simultaneously, navigate with arrow keys, edit any block inline, create siblings above or below, create children to the right, and move or reparent blocks by drag-and-drop or keyboard. A selected-block panel optionally shows a focused preview and editor for the active block. Context-aware dimming fades non-active branches so the reading path stays clear. The note remains a completely normal markdown file throughout: Bismuth writes lightweight HTML-comment block markers (`<!-- bismuth:block:v1 id="..." parent="..." order="..." -->`) before each block in the visible body, and a single hidden base64-encoded JSON metadata comment at the end of the note for fast recovery. If the metadata is stale, Bismuth recovers the exact block tree from the visible markers. If the note is edited in the standard markdown editor between branching-view sessions, Bismuth safely rebuilds the tree from the updated markdown body without losing content. Full Undo/Redo covers all structural and content changes within the branching view.

**Why this priority**: Linear notes fail for argument building, essay drafting, and structured brainstorming where ideas arrive non-linearly. The branching view gives spatial structure to a single note without splitting thoughts across multiple files or requiring a separate canvas format.

**Independent Test**: A user opens a note, switches to branching view, creates a root block, adds two sibling blocks, adds a child to the second sibling, drags the child to become a child of the first sibling, then switches back to markdown view — the note body contains readable prose with valid block markers and no structural loss.

**Acceptance Scenarios**:

1. **Given** the user runs "Open branching view" on a regular markdown note, **When** the view opens, **Then** the note’s prose is parsed into blocks arranged left-to-right; each block is readable as-is in the standard markdown editor with no binary or encoded content visible in the body.
2. **Given** the user presses `Ctrl/Cmd+↓` on a selected block, **When** the command executes, **Then** a new empty sibling block is created directly below the selected block and the cursor is placed in it.
3. **Given** the user presses `Ctrl/Cmd+→` on a selected block, **When** the command executes, **Then** a new empty child block is created to the right of the selected block.
4. **Given** the user drags a block onto another block, **When** the drop completes, **Then** the dragged block becomes a child of the target block; all descendant blocks move with it and the markdown body is updated immediately.
5. **Given** the user performs three structural changes, **When** they press `Ctrl/Cmd+Z` three times, **Then** each undo reverses exactly one structural or content change, independent of the native markdown editor’s undo history.
6. **Given** a note with branching view markers is edited in the standard markdown editor (adding new paragraphs), **When** the branching view is reopened, **Then** Bismuth safely rebuilds the block tree from the updated markdown body; no content is lost.
7. **Given** a block is selected, **When** the selected-block panel is enabled, **Then** the panel displays the block’s full markdown content in an editable area; edits in the panel are reflected in the tree view and the note body in real time.
8. **Given** the user runs "Delete subtree" on a block with children, **When** confirmed, **Then** the block and all its descendants are removed from the tree and the note body; cancelling leaves the tree unchanged.

---

### User Story 20 — Radial Story Timeline *(Group F: Long-form Creative)* (Priority: P4)

A user with an active Writing Project (US18) opens the Radial Story Timeline view. Bismuth reads all scene notes linked to the project and renders them as an SVG radial diagram: each concentric ring represents a subplot; positions along the ring reflect the selected timeline grammar. Four grammar modes are available via toolbar buttons. **Narrative** mode arranges scenes in the order they are revealed to the reader (manuscript sequence). **Chronologue** mode arranges scenes in the in-world chronological order. **Progress** mode replaces the multi-subplot rings with a single combined outer ring and colors each scene by writing status (Todo, Working, Complete, Overdue) with optional target-date display. **Gossamer** mode colors scenes by revision stage (Zero Draft, First Draft, Revised, Final, Press-ready). Hovering a scene card surfaces its synopsis, status, and subplot membership. Scenes that belong to multiple subplots highlight across all their rings simultaneously so cross-plot interrelationships are visible at a glance. The timeline is read-only as a visualization; clicking a scene opens it in the editor. All timeline data is sourced exclusively from the scene notes’ existing frontmatter (`bismuth-subplot`, `bismuth-narrative-order`, `bismuth-chrono-order`, `bismuth-status`, `bismuth-revision-stage`); no separate data file is created.

**Why this priority**: A radial view lets authors perceive story rhythm, act balance, and subplot interweaving that is invisible in a flat scene list. It answers “where is my B-plot relative to the climax?” in seconds.

**Independent Test**: A project with six scenes across two subplots — open Radial Timeline, switch between all four modes, verify scenes reposition and recolor correctly in each, hover one scene and verify synopsis appears, click a scene and verify the scene note opens in the editor.

**Acceptance Scenarios**:

1. **Given** a Writing Project has scenes with `bismuth-subplot` and `bismuth-narrative-order` frontmatter, **When** the Radial Timeline opens in Narrative mode, **Then** each subplot occupies a distinct concentric ring and scenes are positioned along the ring in ascending narrative order.
2. **Given** the user switches from Narrative mode to Chronologue mode, **When** the view updates, **Then** scenes reposition along each ring according to `bismuth-chrono-order` values; scenes without a chrono-order are visually flagged as unplaced.
3. **Given** the user switches to Progress mode, **When** the view updates, **Then** all subplot rings collapse to a single combined outer ring and each scene is colored by its `bismuth-status` value (Todo, Working, Complete, Overdue).
4. **Given** the user switches to Gossamer mode, **When** the view updates, **Then** scenes are colored by `bismuth-revision-stage` (Zero Draft through Press-ready) while subplot ring structure is restored.
5. **Given** the user hovers over a scene card, **When** the tooltip appears, **Then** it displays the scene title, synopsis (from `bismuth-synopsis`), current status, and revision stage.
6. **Given** a scene belongs to two subplots (listed in `bismuth-subplot` as an array), **When** the user hovers that scene, **Then** the scene’s arc is highlighted on all rings it belongs to simultaneously.
7. **Given** the user clicks a scene card in the Radial Timeline, **When** the click fires, **Then** the corresponding scene note opens in the editor without closing the timeline view.
8. **Given** a scene note’s `bismuth-status` frontmatter is updated and saved, **When** the Radial Timeline is visible, **Then** the scene’s color in Progress mode updates within 2 seconds without a manual refresh.

---

### User Story 21 — RSVP Speed Reader *(consolidated into US13 — Group G: Content Consumption)*

*All US21 acceptance scenarios now appear as scenarios 9–12 in the US13 block (Content Consumption: Feeds & RSVP Speed Reader). This entry is retained as a numbered reference only.*

---

### User Story 22 — Git Version Control *(Group H: Integration & Automation)* (Priority: P2)

A user opens a vault that is already a Git repository, or runs "Initialize repository" to create one. Bismuth detects the repo automatically and activates Git integration. A Source Control View panel shows all modified, staged, and untracked files; the user can stage or unstage individual files, write a commit message, and commit directly from the panel. A History View lists commits with message, author, date, and changed files. A Diff View displays line-level changes for any file against the working tree or any prior commit. Editor gutter signs mark added, modified, and deleted lines inline; the user can navigate between hunks with keyboard commands and stage or reset individual hunks without leaving the editor. Automatic commit-and-sync runs on a configurable schedule: Bismuth commits all changes, pulls from the remote, and pushes, entirely in the background without blocking the UI. Auto-pull also fires on startup. Branch commands allow creating, switching, and deleting branches. Remote commands allow adding, editing, and removing remotes, and cloning an existing remote repository. A “Open on GitHub” command opens the current file or its history in the browser. The user can edit `.gitignore` from within Bismuth.

**Why this priority**: Git is the standard mechanism for backup, version history, and collaboration for text-based knowledge vaults. Without it, users risk data loss and have no structured history of their notes.

**Independent Test**: Initialize a Git repo in a test vault, create and modify two notes, stage one file from the Source Control View, commit with a message, verify the History View shows the commit, open Diff View for the modified unstaged file, verify gutter signs appear — all verifiable with no network access required.

**Acceptance Scenarios**:

1. **Given** the vault folder contains a `.git` directory, **When** Bismuth opens, **Then** Git integration is activated automatically; the Source Control View shows current modified and staged files.
2. **Given** the user stages one file and commits with a message from the Source Control View, **When** the commit completes, **Then** the commit appears at the top of the History View with the correct message, timestamp, and changed file.
3. **Given** the History View is open, **When** the user selects a commit, **Then** the list of files changed in that commit is shown; clicking a file opens the Diff View for that commit.
4. **Given** a file has unsaved or uncommitted changes, **When** the Diff View is opened for it, **Then** added lines are highlighted in green and removed lines in red, consistent with standard unified diff conventions.
5. **Given** editor gutter signs are enabled and a file has modified lines, **When** the file is open in the editor, **Then** gutter indicators appear for each added, modified, and deleted hunk; the user can stage or reset a hunk by clicking its gutter indicator.
6. **Given** auto commit-and-sync is enabled with a 10-minute interval, **When** the interval fires, **Then** Bismuth commits all changes, pulls from the configured remote, and pushes, all in a background thread with no perceptible UI freeze.
7. **Given** the user runs "Create branch" and enters a name, **When** the branch is created, **Then** the vault switches to the new branch and the Source Control View reflects the new branch name.
8. **Given** the user is viewing a note and runs "Open file on GitHub", **When** the command fires, **Then** the file’s GitHub URL is opened in the system browser; if no GitHub remote is configured the command displays a non-blocking error notice.

---

### User Story 23 — Startup Experience, Homepage & Personal Tips *(Group I: Customization & Startup)* (Priority: P3)

A user configures a homepage in Bismuth settings by selecting one of several types: a specific named note, a canvas, a saved workspace layout, a random vault file, the graph view, the daily note, or the periodic note. On every startup Bismuth opens the configured homepage; a ribbon button and an "Open homepage" command allow instant return at any time. The user controls three startup tab behaviors (keep existing, replace last-active, or close all), the view mode in which the homepage opens (Reading, Source, Live Preview, or vault default), an optional view-revert when navigating away, and a chain of post-open commands that fire automatically.

Alongside the homepage, the user maintains a personal tips library — short markdown reminders, affirmations, or workflow notes stored as individual files in `.bismuth/tips/` and version-controlled with the vault. Tips surface in three independently togglable displays: a widget on the homepage, a splash overlay during vault startup, and a loading interstitial during heavy view transitions. Selection cycles randomly or sequentially (alphabetical or creation-date order); from any display the user can snooze a tip for a configurable duration or permanently dismiss it without opening the Tips manager. If all tips are snoozed or dismissed the display is silently skipped.

**Why this priority**: A configured starting point reduces session-start friction; personal tips resurface user-authored context at natural moments of transition without interrupting active work.

**Independent Test**: Set homepage to a specific note with tab behavior "close all", add three tips with the homepage widget enabled — quit and reopen Bismuth — verify only the homepage is open in the configured view mode with a tip widget visible.

**Acceptance Scenarios**:

1. **Given** the homepage is configured to a specific note and Bismuth launches, **When** the vault finishes loading, **Then** that note is opened as the sole active tab in the configured view mode.
2. **Given** the homepage type is set to "Daily Note", **When** Bismuth launches, **Then** the note for the current calendar date is opened or created per the periodic note configuration.
3. **Given** the tab behavior is set to "Close all", **When** the homepage opens on startup, **Then** all previously open tabs are closed before the homepage is displayed.
4. **Given** a post-open command is configured, **When** the homepage finishes opening, **Then** the specified command fires automatically without requiring user interaction.
5. **Given** the user opens the Tips manager and saves a new tip, **When** they return to the vault, **Then** a markdown file for the tip exists in `.bismuth/tips/` with the tip content as the file body.
6. **Given** the homepage widget is enabled and at least one tip exists, **When** the homepage opens, **Then** a tip widget displays one randomly or sequentially selected tip.
7. **Given** the startup splash is enabled, **When** Bismuth launches and the vault is loading, **Then** a splash overlay displays a single tip until the vault becomes interactive, then dismisses automatically.
8. **Given** a tip is being displayed, **When** the user clicks "Snooze for 7 days", **Then** that tip is excluded from selection for 7 days; all other eligible tips remain in rotation.

---

### User Story 24 — Personal Tips & Interstitials *(consolidated into US23 — Group I: Customization & Startup)*

*All US24 acceptance scenarios now appear as scenarios 5–8 in the US23 block (Startup Experience, Homepage & Personal Tips). This entry is retained as a numbered reference only.*

---

### User Story 25 — Vault Activity Changelog *(Group H: Integration & Automation)* (Priority: P4)

Bismuth maintains a designated changelog note that lists recently modified vault notes in reverse-chronological order. Each entry shows a configurable datetime stamp and a wikilink to the modified note. On every file save, Bismuth appends the change to the in-memory list, trims the list to the configured maximum, and overwrites the changelog note atomically. A manual "Update changelog" command performs the same operation on demand. Auto-update is disabled by default; the user opts in per vault. Settings allow configuring the changelog file path, datetime format (Moment.js-compatible string), maximum entry count, whether filenames are formatted as wikilinks or plain text, an optional heading to prepend, and a set of excluded folders whose modifications are not tracked.

**Why this priority**: Provides a human-readable "what did I work on recently" summary that complements Git history (which requires opening the History View) and the Navigator’s recent-files list, with zero manual effort once enabled.

**Independent Test**: Enable auto-update, modify three notes in sequence, open the changelog note — verify it lists all three entries in reverse-chronological order with correct timestamps and wikilinks, and that a note inside an excluded folder does not appear.

**Acceptance Scenarios**:

1. **Given** auto-update is enabled and the user saves a note, **When** the file modification is detected, **Then** the changelog note is updated within 2 seconds with a new entry at the top in the format `- <datetime> · [[Note Title]]`.
2. **Given** the changelog has reached the configured maximum entry count and a new note is saved, **When** the changelog updates, **Then** the oldest entry is removed and the new entry is added at the top; the total entry count does not exceed the maximum.
3. **Given** a note inside an excluded folder is saved, **When** the changelog would normally update, **Then** no entry for that note is added to the changelog.
4. **Given** the user runs "Update changelog" manually, **When** the command executes, **Then** the changelog note is overwritten with the current list of recently modified files regardless of whether auto-update is enabled.
5. **Given** wiki-links are disabled in settings, **When** the changelog renders an entry, **Then** the note filename appears as plain text without `[[` and `]]` delimiters.

---

### User Story 31 — Digital Garden Publishing *(Group H: Integration & Automation)* (Priority: P4)

A user selectively publishes notes from their vault to a public website (a "digital garden") by adding `dg-publish: true` to a note’s frontmatter. Bismuth generates a static website from all published notes, preserving wikilinks (which become clickable internal links on the site), embedded images, transclusions, callouts, code blocks, MathJax equations, Mermaid/PlantUML diagrams, Dataview query results, Canvas embeds, and Excalidraw drawings. Notes without the publish flag remain entirely private and are never included in the build — even if they are linked from a published note, the link is rendered as plain text or marked as unpublished. The generated site includes a file-tree navigator, full-text search with live preview, backlinks panel, local graph (showing connections among published notes), global graph, table of contents, and link hover previews. The user can apply any installed Obsidian theme to the site, customize it further via CSS variables and the Style Settings plugin, add custom regex-based content filters (e.g., to strip internal tags or rewrite syntax), assign note icons, and display created/updated timestamps. The site is deployed to Vercel or Netlify via a one-click setup that connects the vault’s Git repository; subsequent publishes trigger automatic rebuilds. A "Publish" command in Bismuth commits all changes to published notes, pushes to the remote, and triggers the deploy. The user can preview the site locally before deploying.

**Why this priority**: Researchers, writers, and educators want to share curated subsets of their knowledge publicly without manually exporting or duplicating content. A digital garden turns the vault into a living public resource while keeping private notes secure, and integrates directly with the existing Git workflow (US22).

**Independent Test**: Mark three notes with `dg-publish: true`, run the local preview server, verify the site renders all three with working wikilinks and a search bar; mark one note as unpublished, rebuild, verify it disappears from the site and its incoming links show as unpublished.

**Acceptance Scenarios**:

1. **Given** a note has `dg-publish: true` in its frontmatter, **When** the site is built, **Then** that note appears as a page on the published site; notes without the flag are excluded entirely even if linked from published notes.
2. **Given** a published note contains a wikilink to another published note, **When** the site renders, **Then** the link is clickable and navigates to the target page; if the target is unpublished the link is styled as inactive or displays a "not published" indicator.
3. **Given** a published note embeds an image or another note via transclusion, **When** the site renders, **Then** the embedded content appears inline exactly as it does in the Bismuth editor.
4. **Given** a published note contains a Dataview query, **When** the site is built, **Then** the query executes against the set of published notes only and the result table/list is rendered as static HTML.
5. **Given** the user has applied an Obsidian theme and configured Style Settings overrides, **When** the site is built, **Then** the published site uses the same theme and CSS variable values as the vault.
6. **Given** the user defines a custom regex filter to strip `#private` tags, **When** the site is built, **Then** all instances of `#private` are removed from the published HTML but remain in the vault notes.
7. **Given** the user runs the "Publish" command, **When** the command completes, **Then** all changes to published notes are committed to Git, pushed to the configured remote, and the hosting provider (Vercel/Netlify) triggers an automatic rebuild.
8. **Given** the user runs the local preview server, **When** the server starts, **Then** the site is accessible at `http://localhost:<port>` and reflects the current state of all `dg-publish: true` notes without requiring a full deploy.

---

### Edge Cases

- What happens when a wikilink target has the same title as multiple notes in different folders?
- How does Bismuth handle circular `belongs_to` relationships in entity linking?
- How does the graph render when a vault has more than 50 000 nodes?
- What happens if a theme CSS file contains invalid rules?
- How does the write-good linter behave on non-English prose?
- How does Bismuth handle binary files (`.pdf`, `.jpg`) opened accidentally in the text editor?
- What happens when two sessions edit the same vault file simultaneously (e.g., external editor + Bismuth)?
- How are wikilinks resolved when a note is renamed or moved?
- What happens when the search HTTP server port is already in use?
- How does OCR behave on low-resolution or rotated images?
- What happens when a canvas references a note that has been deleted?
- How does Presentation Mode handle canvases with no defined slide order?
- How does the search index handle files with non-UTF-8 encoding?
- What happens when a canvas portal creates a circular embed (canvas A portals canvas B which portals canvas A)?
- What happens when an API request targets a file path that traverses outside the vault root (path traversal attack)?
- What happens when two API clients write to the same note simultaneously?
- How does the API behave when Bismuth is busy rendering a large vault or rebuilding the search index?
- What happens when a plugin registers a route that conflicts with a built-in API route?
- How does the MCP server handle an AI agent that sends malformed tool-call arguments?
- What happens when a note is modified by an external editor while it is displayed in the Capture Dashboard?
- How does the dashboard handle a vault with tens of thousands of unclassified notes?
- What happens if a `belongs_to` assignment would create a circular entity relationship?
- What happens when a template's JavaScript block runs an infinite loop or exceeds a time budget?
- How does the template engine handle a template that references another template (nested templates)?
- What happens when a template expression references a vault variable that does not exist at insertion time?
- What happens when a subscribed feed URL permanently redirects or returns a non-feed content type?
- How does Bismuth handle a feed with thousands of articles on first subscribe?
- What happens when article full-text fetching is blocked by the origin site (paywall, bot detection)?
- How does the podcast player behave when the audio stream URL expires or changes?
- What happens when two typing rules have the same trigger pattern and equal priority?
- How does auto-formatting interact with IME composition mode (Chinese, Japanese, Korean)?
- How does tabout behave when paired symbols are nested (e.g., `((cursor))`)?
- What happens when the Navigator cache is stale and shows a note that has been deleted on disk?
- How does the Navigator handle a vault profile that has hidden the currently open note?
- What happens when two vault profiles define conflicting sort orders for the same folder?
- What happens when a sequence forms a cycle (note A's `next` eventually points back to A)?
- What happens when two users edit sequence frontmatter simultaneously in the same vault (e.g., via external editor)?
- What happens when Zen Mode is active and the user opens a note from a hidden group via the Navigator?
- How does tab deduplication behave when the duplicate is in a different tab group?
- What happens when a scene referenced in a compile preset is renamed or deleted before export?
- How does Draft version numbering behave when draft files are manually deleted out of sequence?
- What happens when a Scrivener import encounters RTF content it cannot parse (e.g., embedded images, tracked changes)?
- What happens when branching view block markers in a note are partially corrupted (e.g., by a merge conflict)?
- How does the branching view handle a note that contains frontmatter, callouts, or code fences that span multiple natural paragraphs?
- How does the Radial Timeline render when a project has scenes with no subplot assignment?
- What happens in Chronologue mode when two scenes share the same `bismuth-chrono-order` value?
- How does the RSVP reader handle notes that are almost entirely code blocks or frontmatter (producing very few readable tokens)?
- What happens when an auto commit-and-sync fires while the user is mid-edit of a large note (partial save state)?
- How does Git integration behave when the vault is inside a submodule of a larger repository?
- What happens when the configured homepage note is deleted or renamed between sessions?
- What happens if all tips have been snoozed or dismissed and the homepage widget or interstitial is still enabled?
- What happens when a note in the Recent Files list is deleted or renamed by an external process while the panel is open?
- What happens when a custom icon asset assigned to a toolbar slot cannot be loaded (missing file or broken URL)?
- What happens when Hemingway mode is active and the user attempts to Undo a previously typed block of text — should Undo be permitted or blocked?
- How does sentence dimming behave in notes that are entirely bullet lists or code blocks (which contain no sentence-terminating punctuation)?
- What happens when a user-defined LaTeX snippet has the same trigger and mode options as a built-in snippet — which takes priority and is the conflict surfaced to the user?
- How does Conceal mode behave when the vault theme’s monospace font does not support a Unicode symbol produced by conceal (e.g., a rare operator)?
- What happens when a published note embeds a PDF larger than the 20 MB limit — does the build fail or is the embed skipped with a warning?
- What happens when a note’s entire content is replaced (e.g., overwritten by a sync tool) — does the stale cached embedding vector produce misleading connections until the re-index completes?
- What happens when the changelog note itself is modified (does it trigger a self-referential entry)?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Bismuth MUST open any folder on disk as a vault and persist vault-level settings within that folder.
- **FR-002**: Bismuth MUST render markdown files with full CommonMark support including headings, lists, tables, code blocks, and embedded images.
- **FR-003**: Bismuth MUST display a welcome screen with two options — blank vault and template vault — using a dark color scheme on first launch or when no vault is open.
- **FR-004**: Bismuth MUST support vault templates including at minimum PARA, Johnny Decimal, and Zettelkasten on the welcome screen.
- **FR-005**: Bismuth MUST resolve `[[Wikilink]]` references across the entire vault and keep the index updated on file changes.
- **FR-245**: When the user clicks a wikilink to a non-existing note, Bismuth MUST create the new note in the location specified by the vault’s "Default location for new notes" setting, regardless of whether the wikilink contains a path (e.g., `[[folder/note]]` or `[[../folder/note]]`).
- **FR-246**: Wikilinks with relative or absolute paths (e.g., `[[folder/note]]`, `[[../note]]`) MUST NOT bypass the default location setting; the path component MUST be ignored for note creation and the note MUST be created in the configured default location with the filename derived from the link text.
- **FR-247**: Bismuth MUST NOT create notes outside the vault root; if a wikilink would resolve to a path outside the vault (e.g., `[[../../outside]]`), the note MUST be created in the default location and a warning MUST be displayed to the user.
- **FR-006**: Bismuth MUST provide a graph view displaying notes as nodes and wikilinks as directed, color-coded edges with user-configurable colors.
- **FR-007**: Bismuth MUST support node and edge filtering in the graph view by tag, Portent type, folder, and link depth.
- **FR-008**: Bismuth MUST implement the Portent entity model with all eight default types (`Project`, `Operation`, `Responsibility`, `Task`, `Event`, `Note`, `Topic`, `Person`) read from YAML frontmatter.
- **FR-009**: Bismuth MUST support `belongs_to` and `related_to` relationships between entities and expose backlink resolution in the entity panel.
- **FR-010**: Bismuth MUST surface concept link suggestions when inline text matches the title of another note in the vault.
- **FR-256**: Bismuth MUST provide an automatic note linker accessible via command palette that scans the current note (or all notes in the vault) for unlinked references to other note titles and aliases, presenting a reviewable list of potential links grouped by target note.
- **FR-257**: The note linker MUST support batch link creation: the user selects which potential links to create from the presented list, and all selected references are converted to wikilinks in a single atomic operation; the operation MUST be reversible via undo.
- **FR-258**: The note linker MUST respect existing wikilinks and MUST NOT suggest converting already-linked text; it MUST match note aliases (from frontmatter `aliases:` array) in addition to note titles; case-insensitive matching MUST be configurable per vault.
- **FR-011**: Bismuth MUST apply user-provided CSS theme files from the vault's `themes/` folder to all editor surfaces; the UI component library and CSS variable naming MUST be compatible with Obsidian theme conventions (e.g., `--background-primary`, `--text-normal`, `--interactive-accent`) to support the existing Obsidian theme ecosystem without modification; Bismuth MUST provide a Style Settings system that parses `/* @settings` YAML comments in CSS files (themes, snippets, plugins) and generates a dynamic UI for: class toggles, variable text/number/color/select controls, headings, color gradients, themed colors (light/dark variants), sliders, and localized titles/descriptions — all persisted per vault.
- **FR-012**: Bismuth MUST provide a `plugins/` folder API that loads conforming plugins at startup without requiring a rebuild.
- **FR-013**: Bismuth MUST provide a two-row top editor toolbar with icon-driven formatting actions (bold, italic, underline, strikethrough, heading levels, inline code, code block, link, image, list, table, quote).
- **FR-014**: Bismuth MUST support multiple configurable layouts with persistence per vault.
- **FR-015**: Bismuth MUST provide write-good style linting with inline underlines and sidebar explanations; checks MUST include: passive voice, lexical illusions (repeated words), sentences starting with "So" or "There is/are", weasel words, adverbs (-ly words), wordy phrases, clichés, and E-Prime violations (to-be verbs); each check MUST be independently togglable; linting MUST be opt-in per note via command palette or hotkey.
- **FR-248**: Bismuth MUST provide a comprehensive Linter with independently togglable rules organized into five categories: YAML (frontmatter formatting, tag/array deduplication, key sorting, timestamp insertion), Headings (capitalization, increment validation, trailing punctuation removal), Footnotes (positioning, re-indexing), Content (misspelling correction, list/blockquote/emphasis/strong style enforcement, ellipsis/quote normalization, bare URL wrapping), and Spacing (blank line rules, tab/space conversion, trailing space removal, CJK-English spacing).
- **FR-249**: The Linter MUST support manual execution via command palette, automatic execution on file save (opt-in per vault), and paste rules that apply formatting transformations to pasted content (e.g., remove hyphens, normalize ellipsis, strip footnotes from quotes, prevent double list markers).
- **FR-250**: Each Linter rule MUST be independently configurable with its own enable/disable toggle and rule-specific options (e.g., heading capitalization style, YAML array format, list marker character); rule configurations MUST persist per vault.
- **FR-251**: The Linter MUST display a summary of changes after execution (e.g., "Applied 12 rules, modified 3 sections") and MUST integrate with the editor’s undo stack so all linter changes are reversible with a single Ctrl/Cmd+Z.
- **FR-016**: Bismuth MUST support inline and sidebar text annotations with color-coded highlights, persistent across sessions.
- **FR-017**: Bismuth MUST support PDF and image viewing with inline annotation capability.
- **FR-259**: Bismuth MUST transform backlinks to PDF files into highlight annotations: when a note links to a text selection in a PDF (e.g., `[[file.pdf#page=1&selection=0,1,2,3]]`), the referenced text MUST be visually highlighted in the PDF viewer; backlinks MUST support optional color specification via `&color=<COLOR>` parameter.
- **FR-260**: The PDF viewer MUST provide a color palette toolbar allowing users to select text and click a color to copy a link with `&color=...` appended; link copy format MUST be customizable via templates with variables for page, selection, color, and extracted text.
- **FR-261**: Bismuth MUST support hover-to-preview and hover-to-open for highlighted text in PDFs: hovering over a highlight while pressing Ctrl/Cmd MUST show a popover preview of the backlink or open it directly (configurable); double-clicking a highlight MUST open the corresponding backlink.
- **FR-262**: The PDF viewer MUST support filtering backlinks by page (show only backlinks to the currently visible page), bidirectional hover sync between PDF highlights and backlinks pane items, and optional direct PDF annotation (adding highlights to the PDF file itself, not just visual overlays).
- **FR-263**: Bismuth MUST support PDF page composition commands (add, insert, remove, extract pages with automatic link updates across vault), outline/table-of-contents editing (add, rename, move, delete items via right-click or drag-and-drop), and page label editing.
- **FR-264**: PDF embeds MUST support: click-to-open, trim-selection mode (show only selection + margin, not full page), configurable toolbar visibility, rectangular selection embeds with `&rect=...` parameter, and optional zoom/unscrollable modes.
- **FR-265**: The PDF viewer MUST provide keyboard shortcuts for outline/thumbnail toggle, sidebar close, zoom in/out, fit width/height, go-to-page, and copy format menu; optionally support opening PDFs in external apps with focus sync between Obsidian and the external viewer.
- **FR-266**: Bismuth MUST support single-scene projects for short works (short stories, poems, essays): a single note with bismuth-type project frontmatter where the prose is written directly in the project note itself rather than in separate scene files; single-scene projects MUST support the same draft versioning, word count tracking, and compile workflows as multi-scene projects.
- **FR-267**: Bismuth MUST provide daily writing session goals with configurable target word count, session duration, or both; the goal tracker MUST display progress in real-time during the session, persist across application restarts, and reset daily; users MUST be able to configure goal scope (per-project, per-scene, or vault-wide) and notification preferences (toast, status bar, or silent).
- **FR-268**: Bismuth MUST provide Kanban boards stored as markdown notes with columns represented as H2 headings and cards as list items; cards MAY contain metadata (dates, tags, wikilinks) in YAML-like syntax within the list item.
- **FR-269**: Kanban boards MUST support drag-and-drop: dragging cards between columns updates the underlying markdown immediately; dragging columns reorders headings; all changes MUST be reflected in the source markdown without data loss.
- **FR-270**: Kanban cards MUST support inline editing (click to edit title/description) and modal editing (full markdown editor); cards MUST support checkboxes, due dates, completion dates, tags, and wikilinks.
- **FR-271**: Kanban boards MUST provide: archive column (manual or auto-move completed cards), date tracking (due/completion), tag filtering, search within board, card count per column, and configurable card metadata visibility.
- **FR-272**: Kanban boards MUST support toggling between Board View (visual drag-and-drop interface) and Source View (raw markdown editor); settings MUST allow customization of board/column/card appearance (colors, card width, hide metadata fields).
- **FR-273**: Bismuth MUST automatically update frontmatter created (from filesystem ctime on first save) and updated (from filesystem mtime on every save) fields; field names MUST be configurable; auto-update MUST be opt-in per vault with configurable excluded folder patterns (e.g., templates).
- **FR-274**: Timestamp fields MUST support both string (formatted dates using Obsidian default or custom Moment.js format) and number (Unix timestamps in milliseconds) data types; format MUST be configurable per field; when a file is modified externally, Bismuth MUST sync metadata from filesystem on next open.
- **FR-018**: Bismuth MUST provide basic in-app image editing: crop, brightness, and contrast adjustment.
- **FR-019**: Bismuth MUST export notes or entire vaults as static web sites (default: Svelte) deployable to Git Pages.
- **FR-020**: Bismuth MUST store per-file edit history locally and provide diff-based restore.
- **FR-021**: Bismuth MUST warn the user (non-blocking toast) when a file exceeds 10 MB or folder nesting exceeds 10 levels.
- **FR-022**: Bismuth MUST provide code editing with syntax highlighting, autocompletion, bracket matching, and code folding for all common languages.
- **FR-023**: Bismuth MUST provide a button to open the current file in an external editor (default VS Code; configurable).
- **FR-024**: Bismuth MUST provide a tag management panel with: context menu for rename (with hierarchical child tag propagation and merge conflict warnings), search (add to current search, exclude from search), tag pages (create/open notes aliased to tags, Alt-click to open, hover preview), drag-and-drop tag reorganization, collapse/expand hierarchy controls, random note with tag (if available), hide, and graph visibility controls; tag renaming MUST use Obsidian's parse data to avoid false matches in markdown links and MUST update both note body tags and frontmatter YAML tags atomically.
- **FR-025**: Bismuth MUST operate entirely locally with no required network calls, no mandatory accounts, and no paid APIs.
- **FR-026**: Bismuth MUST reuse existing components, utilities, and patterns where they satisfy the requirement without reducing readability or maintainability.
- **FR-027**: Bismuth MUST maintain consistent visual design across all surfaces — colors, typography, spacing, and interaction patterns MUST follow a shared design token system.
- **FR-028**: Bismuth MUST provide a unified search panel powered by MiniSearch with BM25 ranking, returning results within 200 ms for vaults up to 50 000 files.
- **FR-029**: Search MUST support typo tolerance (fuzzy matching), quoted exact-phrase expressions, `-word` exclusions, and `type:`/`tag:` field filters.
- **FR-030**: Search MUST be keyboard-first with full Vim navigation (`j`/`k` to move, Enter to open, configurable shortcuts) and MUST NOT require mouse interaction for any search action.
- **FR-031**: Search MUST support toggling between vault-wide and in-file (current document) scope without closing the panel.
- **FR-032**: Search results MUST display file path, a matched-text snippet, and relevance score, and MUST list all visible vault files when the query is empty.
- **FR-033**: From any search result the user MUST be able to insert a wikilink at the current editor cursor position.
- **FR-034**: Bismuth MUST expose a local REST API server (default `localhost` only) covering full vault CRUD, surgical section patching, full-text and JsonLogic metadata search, active-file access, periodic note management, command palette execution, tag listing, and a plugin route extension interface — all authenticated via a user-generated API key. See FR-045–FR-053 for detail.
- **FR-035**: Bismuth MUST extract text from image files via OCR and index that text for search; a custom model slot MUST exist for user-trained handwriting recognition.
- **FR-036**: Bismuth MUST support canvas files (`.canvas`) using the JSON Canvas format as the base interchange format, extended with Bismuth-specific metadata.
- **FR-037**: Canvas MUST support file nodes (linked vault notes), text nodes, and image nodes on an infinite zoomable surface.
- **FR-038**: Canvas edges MUST support directed arrows, path styles (solid, dashed, dotted), pathfinding methods, and floating or fixed attachment points; direction MUST be reversible.
- **FR-039**: Canvas nodes MUST support flowchart shapes, border styles, text alignment, z-order control, auto-resize to content, and custom CSS styles.
- **FR-040**: Canvas MUST support collapsible groups, Focus Mode (blur non-selected nodes), Presentation Mode (slide-by-slide navigation), and Portals (embed one canvas inside another).
- **FR-041**: Canvas MUST support Encapsulate Selection (move selected nodes to a new canvas file with a portal link back).
- **FR-042**: Canvas files MUST integrate with the Bismuth graph view, outgoing links, and backlinks exactly as markdown notes do, including frontmatter support.
- **FR-043**: Canvas MUST support export to PNG and SVG with optional transparent background.
- **FR-044**: Canvas edges MUST highlight when a connected node is selected, and edge selection MUST be possible for multi-edge operations.
- **FR-045**: The REST API MUST support full CRUD (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) on any file in the vault including binary files, with paths relative to the vault root.
- **FR-046**: The REST API `PATCH` endpoint MUST support surgical section targeting by heading name, block reference ID, or frontmatter key, with `append`, `prepend`, and `replace` operation modes that leave all other file content unchanged.
- **FR-047**: The REST API MUST support full-text search and structured JsonLogic queries against note metadata (frontmatter fields, tags, file path, and content).
- **FR-048**: The REST API MUST expose endpoints to read and write the file currently open in the Bismuth editor (`GET /vault/active`, `PUT /vault/active`).
- **FR-049**: The REST API MUST support periodic note operations (get or create daily, weekly, monthly, quarterly, and yearly notes) respecting configured templates.
- **FR-050**: The REST API MUST expose a command execution endpoint that triggers any registered Bismuth command by its ID, equivalent to invoking it from the command palette.
- **FR-051**: The REST API MUST expose a tag listing endpoint returning all tags across the vault with usage counts.
- **FR-052**: All REST API endpoints MUST require a user-generated API key sent via an `Authorization` header; requests without a valid key MUST return HTTP 401 and MUST NOT expose any vault data.
- **FR-053**: Bismuth MUST expose an MCP (Model Context Protocol) server providing the same vault capabilities as the REST API, enabling AI agents to interact with the vault using standard MCP tool calls.
- **FR-054**: The plugin API MUST allow plugins to register additional REST API routes; registered plugin routes MUST be isolated from built-in routes and MUST authenticate via the same API key mechanism.
- **FR-055**: Bismuth MUST provide a Capture Dashboard view listing all notes whose frontmatter lifecycle state is `captured` (i.e., `organized: false` and `archived: false`), with title, creation date, and body preview.
- **FR-056**: From the Capture Dashboard, the user MUST be able to assign a Portent type, set lifecycle state (`captured`, `organized`, `archived`), and add `belongs_to` and `related_to` relationships to any note without navigating away.
- **FR-057**: All Capture Dashboard classification actions MUST update the note's YAML frontmatter atomically; partial writes MUST NOT occur.
- **FR-058**: Bismuth MUST provide a global quick-capture keyboard shortcut that creates a new note with `organized: false` in frontmatter and places the cursor in the body within 200 ms from any view.
- **FR-059**: The Capture Dashboard MUST update in real time when a new note with `captured` lifecycle state is added to the vault (including via the REST API or an external file drop).
- **FR-060**: The Capture Dashboard MUST support batch classification — selecting multiple notes and applying a type and lifecycle state to all in a single confirmed action.
- **FR-061**: Archived notes (frontmatter `archived: true`) MUST be hidden from the main file tree, graph view, and tag panel by default, but MUST remain fully searchable and accessible by direct path.
- **FR-252**: Bismuth MUST provide an Inbox Organiser that automatically moves newly created notes from a watched folder (default: vault root) into a designated inbox folder (default: `inbox/`) within a configurable time window (default: immediate); this behavior MUST be opt-in per vault.
- **FR-253**: The Inbox Organiser MUST provide a modal interface accessible via command palette that displays all notes currently in the inbox folder with a folder-picker dropdown for each note, allowing the user to move notes to their permanent locations in batch or individually.
- **FR-254**: The Inbox Organiser MUST support periodic reminders (configurable interval, default: daily) that display a notice prompting the user to organize their inbox when unorganized notes are present; the reminder MUST be dismissible and MUST respect a "do not remind again today" option.
- **FR-255**: The inbox folder and watched folder MUST be independently configurable in settings; notes created outside the watched folder MUST NOT be auto-moved to the inbox; notes manually moved into the inbox folder MUST appear in the organizer modal even if they were not auto-collected.
- **FR-062**: Bismuth MUST provide a template engine that resolves `<% expression %>` tokens in template files at insertion time, supporting multi-line and inline token placement.
- **FR-063**: The template engine MUST provide a built-in `tp.file` module exposing at minimum: `title`, `creation_date(format?)`, `last_modified_date(format?)`, `path`, and `folder`.
- **FR-064**: The template engine MUST provide a built-in `tp.date` module exposing at minimum: `now(format, offsetDays?)`, `yesterday(format?)`, and `tomorrow(format?)`.
- **FR-065**: The template engine MUST support inline JavaScript execution blocks (`<%* ... %>` or equivalent delimiter) that run in a sandboxed runtime with read-only access to vault metadata and NO access to the host filesystem outside the vault root, network APIs, or system globals.
- **FR-066**: Bismuth MUST provide a template picker UI (searchable, keyboard-navigable) for inserting a template into a new or existing note.
- **FR-067**: Templates MUST be storable as markdown files in the vault's `templates/` directory; any `.md` file in that directory MUST be available in the template picker without additional registration.
- **FR-068**: Bismuth MUST support folder-scoped templates: a template can be associated with a specific vault folder and MUST be auto-suggested (not auto-applied without confirmation) when a new note is created in that folder.
- **FR-069**: Bismuth MUST support Portent-type templates: a template associated with a Portent type MUST be offered for application when a note is assigned that type in the Capture Dashboard or entity panel.
- **FR-070**: Users MUST be able to define reusable JavaScript helper functions in a `templates/helpers/` directory; these helpers MUST be available to all template JavaScript blocks within the same vault.
- **FR-071**: If a template token fails to resolve (syntax error, missing variable, sandbox violation, or timeout), Bismuth MUST report the specific token and reason as an inline error and MUST NOT insert partial output into the note.
- **FR-072**: Bismuth MUST provide a Feed Dashboard view for managing RSS, Atom, and JSON feed subscriptions, displaying articles in a paginated, sortable, filterable list.
- **FR-073**: Bismuth MUST auto-detect feed format (RSS 2.0, Atom, JSON Feed) from a pasted URL and add the feed without requiring the user to specify the format.
- **FR-074**: Bismuth MUST convert a YouTube channel page URL to the channel's public RSS feed URL and display video entries without requiring a YouTube Data API key.
- **FR-075**: Bismuth MUST support podcast feeds, displaying episode entries with title, description, duration, and publication date.
- **FR-076**: Bismuth MUST provide a built-in article reader that fetches the full body of a feed article, converts it to Markdown, and renders it within the app.
- **FR-077**: From the Feed Dashboard reader or article list, the user MUST be able to save an article as a vault note using a configurable save template; the saved note MUST be created with lifecycle state `captured` so it appears in the Capture Dashboard.
- **FR-078**: Feed save templates MUST support at minimum the following variables: `{{title}}`, `{{url}}`, `{{published}}`, `{{feed_name}}`, `{{summary}}`, `{{tags}}`; they MUST also support the full Template Engine syntax (`<% %>`) from FR-062.
- **FR-079**: Feeds MUST be organizable into user-defined folders and subfolders with hierarchical display in the Feed Dashboard sidebar.
- **FR-080**: Articles MUST be filterable by: read/unread status, starred, saved to vault, age (last N days), and feed folder; and sortable by newest, oldest, and grouped by feed or date.
- **FR-081**: Bismuth MUST support auto-refresh of all subscribed feeds on a user-configurable interval (minimum 5 minutes) running in the background without interrupting the active view.
- **FR-082**: Bismuth MUST support OPML import (adding all feeds and preserving folder structure) and OPML export (all subscriptions with folder structure) with duplicate URL detection on import.
- **FR-083**: All feed fetching MUST occur over HTTPS by default; HTTP feeds MUST be permitted only with an explicit per-feed user opt-in warning.
- **FR-084**: Bismuth MUST provide auto-spacing between configurable script pairs (CJK–Latin, CJK–digit, Latin–digit, and user-defined categories) inserted as the user types, immediately undoable with a single `Ctrl/Cmd+Z`.
- **FR-085**: Bismuth MUST auto-capitalize the first letter of sentences during typing.
- **FR-086**: Bismuth MUST auto-insert full-width punctuation after CJK characters when the user types the equivalent half-width key, without requiring an IME mode switch.
- **FR-087**: Bismuth MUST auto-close paired CJK brackets and quotes (e.g., `（）`, `《》`, `「」`) and support Tab-out to jump past the closing symbol.
- **FR-088**: Bismuth MUST convert `··` (two middle-dot characters) to an inline code span at the cursor, placing the cursor inside the span.
- **FR-089**: Bismuth MUST provide a smart Backspace that removes an empty list marker or empty blockquote prefix in one keystroke.
- **FR-090**: Bismuth MUST provide Smart Paste that auto-applies the current list or blockquote prefix to pasted content when pasting inside a list or quote block.
- **FR-091**: Bismuth MUST expose format commands: Format Article (`Mod+Shift+S`), Format Selection/Line (`Mod+Shift+L`), Delete Blank Lines (`Mod+Shift+K`), Insert Code Block (`Mod+Shift+N`), and Toggle Auto-format (`Ctrl+Tab`); all MUST be remappable.
- **FR-092**: Bismuth MUST provide a Rule Engine supporting three rule types: `Input` (triggered by a typed pattern), `Delete` (triggered by Backspace on a pattern), and `SelectKey` (triggered by typing a key after selecting text).
- **FR-093**: Rule Engine rules MUST support: regex triggers with capture group back-references, tabstop placeholders (`$0`, `$1`, `${1:default}`) navigated with Tab, scope restriction (text / formula / code contexts), code-language filtering for code-scope rules, and JavaScript function replacements executed in the same sandbox as the Template Engine (FR-065).
- **FR-094**: Rules MUST be priority-ordered with drag-and-drop reordering in the settings UI; higher-priority rules MUST win when multiple rules match the same trigger.
- **FR-095**: Users MUST be able to import and export all custom rules as a JSON file.
- **FR-096**: Auto-formatting MUST be excludable per-file by a path-pattern list configured in vault settings; excluded files MUST receive no automatic transformations.
- **FR-097**: Bismuth MUST replace the default file tree with a two-pane Navigator: a navigation pane (folder tree, tag tree, property browser tabs) and a list pane (files within the selected node), supporting both dual-pane and single-pane layout modes.
- **FR-098**: Both Navigator panes MUST be fully keyboard-navigable with arrow-key defaults and user-configurable bindings; Vim-style bindings (`h`/`j`/`k`/`l`) MUST be addable via the hotkey configuration without code changes.
- **FR-099**: The Navigator MUST support filter search across file name, tags, frontmatter properties, dates, folder paths, file extensions, and task presence, using AND/OR/exclusion operators as described in US15; search state MUST persist between sessions.
- **FR-100**: The Navigator MUST support at least nine named shortcut slots (notes, folders, tags, or saved searches) accessible by command and keyboard shortcut, with pinning and drag-and-drop reordering.
- **FR-101**: The Navigator MUST support vault profiles: named configurations each storing their own hidden-content rules, shortcut slots, sort preferences, and optional banner; switching profiles MUST reload the view without restarting Bismuth.
- **FR-102**: Notes in the list pane MUST display up to five configurable preview lines, an optional featured-image or auto-generated thumbnail, modification date, tags, and configured frontmatter properties.
- **FR-103**: The Navigator MUST support pinning individual notes to the top of any folder or tag view, independent of the active sort order.
- **FR-104**: The Navigator MUST support assigning colors and Lucide or emoji icons to folders, tags, properties, and individual files; assignments MUST be readable from and writable to frontmatter.
- **FR-105**: The Navigator MUST support hiding folders, tags, notes, or files by path pattern, frontmatter property value, or tag, configurable per vault profile.
- **FR-106**: The Navigator MUST support drag-and-drop for: moving files between folders, reparenting tags in the tag tree, assigning files/folders/tags to shortcut slots, and spring-loaded folder expansion during drag.
- **FR-107**: The Navigator MUST provide file operations accessible from context menus and commands, always scoped to the currently selected folder or tag: create note, create note from template (via US12), rename, duplicate, move, trash, merge selected notes into one, and convert note to folder note.
- **FR-108**: The Navigator MUST support multi-selection via `Cmd/Ctrl+Click`, `Shift+Click`, `Shift+Arrow`, `Shift+Home/End`, and `Cmd/Ctrl+A` (select all in current view).
- **FR-109**: The Navigator MUST include a calendar panel showing the note history by day; clicking a day MUST open (or create) the daily note for that date using the configured template.
- **FR-110**: The Navigator MUST support grouping notes by date buckets (Today, Yesterday, Previous 7 days, Previous 30 days, month, year) when sorted by modification or creation date.
- **FR-111**: The Navigator MUST support custom sort and grouping overrides per folder or tag, independent of the global sort setting.
- **FR-112**: The Navigator MUST expose a public plugin API for metadata management, navigation control, and event subscription, enabling other Bismuth plugins to interact with the Navigator programmatically.
- **FR-113**: The Navigator MUST support folder notes: a designated note inside a folder that represents the folder itself; the folder note MUST be pinnable, openable by pressing Enter on the folder, and convertible to/from regular notes via commands.
- **FR-114**: The Navigator MUST provide a Rebuild Cache command that refreshes the local metadata index when the display is stale.
- **FR-115**: Bismuth MUST support note sequences defined by `prev` and `next` YAML frontmatter properties containing wikilink values; notes with either property MUST display previous and next arrow buttons in the note header.
- **FR-116**: Arrow buttons MUST open the linked note in the current tab; `Cmd/Ctrl`-clicking MUST open the linked note in a new tab.
- **FR-117**: Bismuth MUST provide an "Insert note before current note" and an "Insert note after current note" command, each opening a note picker that accepts both existing notes and new note names; inserting a note MUST update both sides of the relationship atomically (reciprocal links).
- **FR-118**: Bismuth MUST provide a "Remove current note from sequence" command that clears the note's `prev` and `next` properties and reconnects the neighboring notes, without deleting the file.
- **FR-119**: Bismuth MUST provide a "Delete current note from sequence" command that moves the current note to trash and reconnects the neighboring notes; a confirmation dialog MUST be shown by default and MUST be disableable in settings.
- **FR-120**: When any vault note that contains `prev` or `next` sequence links is deleted by any means, Bismuth MUST automatically detect the deletion and reconnect the neighboring notes.
- **FR-121**: The sequence note picker MUST support an "Only show sibling notes" mode that restricts suggestions to notes in the same folder as the current note; this MUST be configurable in settings.
- **FR-122**: Bismuth MUST display open tabs in a vertical sidebar list showing the full file name; the vertical list and any horizontal tab strip MUST remain in sync at all times.
- **FR-123**: Tabs MUST support manual reordering via drag-and-drop and automatic sorting by name, pin state, or recent activity, configurable per tab group.
- **FR-124**: Tabs MUST be organizable into named, renameable, collapsible, hideable tab groups; each group MUST be independently switchable between four views: Default (one tab), Continuous (scrollable multi-tab document), Column (side-by-side), and Mission Control (thumbnail grid).
- **FR-125**: Bismuth MUST support Zen Mode: a toggle that hides all tab groups except the one containing the active tab, restoring all groups on deactivation.
- **FR-126**: Bismuth MUST support per-tab zoom: independent zoom levels per tab that do not affect the rest of the UI or other tabs.
- **FR-127**: The vertical tab list MUST support an enhanced keyboard switcher: `Cmd/Ctrl+→` and `Cmd/Ctrl+←` shift the `Cmd/Ctrl+1–8` index window by eight, and the vertical list MUST scroll to keep the indexed range visible.
- **FR-128**: Each tab MUST maintain its own navigation history; right-clicking a vertical tab MUST expose the full history with actions to navigate to any entry, bookmark it, or clear it; the history MUST also be openable as a new tab group.
- **FR-129**: Bismuth MUST support Smart Navigation: when enabled, notes opened from within a tab group open as new tabs in the same group rather than in a different group or split.
- **FR-130**: Bismuth MUST support Ephemeral Tabs: tabs marked ephemeral (displayed in italic) replace themselves when a new note is opened and close when the user navigates away; auto-closing MUST be configurable.
- **FR-131**: Bismuth MUST support Tab Deduplication: when a note that is already open in any tab is opened again, focus MUST redirect to the existing tab rather than creating a duplicate; scope (same group only, all groups, including sidebar/popup) MUST be configurable.
- **FR-132**: Hovering over a vertical tab while holding `Cmd/Ctrl` MUST display a live preview of the tab’s content without switching to it.
- **FR-133**: Tab groups MUST be assignable custom colors and icons for visual distinction; assignments MUST persist across restarts.
- **FR-134**: Bismuth MUST support a long-form writing project model where projects, scenes, sub-scenes, and draft snapshots are identified by `bismuth-type` YAML frontmatter (`project`, `scene`, `sub-scene`, `draft`), not by folder location.
- **FR-135**: A project note MUST track a target word count and display a live progress bar calculated from the word counts of all linked scenes.
- **FR-136**: Bismuth MUST provide a "New Draft" command that: (a) snapshots the current scene’s prose into a dated, read-only-by-convention draft file with `bismuth-type: draft`, `draft-of`, and `draft-version` frontmatter; (b) creates a fresh working-draft file linked to the scene; and (c) navigates to the new working draft.
- **FR-137**: All draft snapshot files MUST remain as plain markdown files in the vault, openable in any view or split pane for side-by-side comparison.
- **FR-138**: Bismuth MUST provide a Manuscript Builder UI with named compile presets; each preset MUST allow selecting and ordering scenes, choosing formatting options, and selecting an output format from: Markdown, ODT, PDF, and DOCX.
- **FR-139**: The Manuscript Builder MUST include a Preview tab that renders the current preset’s output as a single continuous read-only prose document and re-renders automatically within 2 seconds of saving any scene in the preset.
- **FR-140**: The Manuscript Builder MUST be dockable as a persistent workspace tab, displayed alongside the active editor without requiring a modal.
- **FR-141**: Scenes with `status: archived` in frontmatter MUST be hidden from the Navigator and graph view by default, consistent with FR-061, but remain accessible by direct path and search.
- **FR-142**: Bismuth MUST provide a status-based scene workflow with at least the following statuses: `draft`, `in-progress`, `revised`, `final`, `archived`; status MUST be filterable in the Navigator and Manuscript Builder scene list.
- **FR-143**: Bismuth MUST provide a multi-step Scrivener 3 import wizard that reads a `.scriv` bundle placed anywhere in the vault and produces Draft Bench–typed frontmatter notes for chapters, scenes, sub-scenes, synopses, notes, comments, footnotes, keywords, and custom metadata; RTF field-instruction groups and binary content MUST be stripped from output.
- **FR-144**: The import wizard MUST offer an option to import versioned drafts from the Scrivener project’s snapshot history; importing drafts MUST be opt-in.
- **FR-145**: All project, scene, and draft frontmatter properties MUST use a `bismuth-` namespace prefix to avoid collision with user-defined or other plugin properties.
- **FR-146**: Bismuth MUST provide a Branching Block Editor view mode for any markdown note, rendering the note’s prose as a left-to-right tree of markdown blocks where siblings are vertical and children extend to the right.
- **FR-147**: The branching view MUST store block structure entirely within the note itself using: (a) visible HTML-comment block markers (`<!-- bismuth:block:v1 id="..." parent="..." order="..." -->`) before each block, and (b) a single hidden base64-encoded JSON metadata comment at the end of the file; no sidecar files or external databases are used.
- **FR-148**: If the metadata comment is absent or stale, Bismuth MUST recover the exact block tree from the visible block markers alone; if the note was edited in standard markdown mode between sessions, Bismuth MUST rebuild the tree from the updated markdown body without losing content.
- **FR-149**: The branching view MUST support the following block operations, all accessible by keyboard and context menu: create sibling above, create sibling below, create child to the right, move block up/down among siblings, move block left (promote to parent level), move block right (demote to child of previous sibling), duplicate block, duplicate subtree, delete block (no confirmation), delete subtree (confirmation required).
- **FR-150**: Block reordering and reparenting MUST be performable by drag-and-drop; all descendant blocks MUST move with a reparented block.
- **FR-151**: The branching view MUST support an optional selected-block panel showing the focused full markdown content of the active block in an editable area; edits in the panel MUST be reflected in the tree and note body in real time.
- **FR-152**: The branching view MUST apply context-aware dimming to non-active branches, keeping the current branch’s reading path visually distinct.
- **FR-153**: The branching view MUST provide a block-level search overlay (`Ctrl/Cmd+F`) that highlights matching blocks and allows keyboard navigation between matches.
- **FR-154**: The branching view MUST maintain its own Undo/Redo stack covering all structural and content changes within the view, independent of the native markdown editor’s undo history; `Ctrl/Cmd+Z` and `Ctrl/Cmd+Shift+Z` MUST operate on this stack.
- **FR-155**: Frontmatter, if present in the note, MUST be preserved and excluded from block parsing; it MUST NOT appear as a block card in the branching view.
- **FR-156**: Bismuth MUST provide a Radial Story Timeline view for Writing Projects (US18), rendering all linked scene notes as an SVG radial diagram where each concentric ring represents a subplot and arc position reflects the active timeline grammar.
- **FR-157**: The Radial Timeline MUST support four switchable grammar modes via toolbar buttons: Narrative (manuscript sequence via `bismuth-narrative-order`), Chronologue (in-world chronological order via `bismuth-chrono-order`), Progress (single combined ring, scenes colored by `bismuth-status`: Todo/Working/Complete/Overdue), and Gossamer (scenes colored by `bismuth-revision-stage`: Zero Draft/First Draft/Revised/Final/Press-ready).
- **FR-158**: Hovering a scene card MUST display a tooltip containing the scene title, synopsis (`bismuth-synopsis`), current status, and revision stage.
- **FR-159**: Scenes assigned to multiple subplots (array value in `bismuth-subplot`) MUST be rendered on all their subplot rings simultaneously; hovering such a scene MUST highlight its arc on every ring it occupies.
- **FR-160**: Clicking a scene card in the Radial Timeline MUST open the corresponding scene note in the editor without closing the timeline view.
- **FR-161**: The Radial Timeline MUST update scene colors and positions reactively within 2 seconds when a linked scene note’s frontmatter is saved.
- **FR-162**: Scenes without a value for the active grammar’s order field MUST be visually flagged as unplaced (e.g., greyed out or shown in an overflow area) rather than omitted or causing an error.
- **FR-163**: All Radial Timeline data MUST be sourced from scene note frontmatter using the `bismuth-` namespace fields; no separate data file or index is created for the timeline.
- **FR-164**: The Radial Timeline MUST support zoom and pan interactions; `Ctrl/Cmd+scroll` MUST zoom the SVG scene and clicking the zoom indicator MUST reset to 100%.
- **FR-165**: Bismuth MUST provide an RSVP Speed Reader overlay that presents one word at a time at a configurable WPM rate; the overlay MUST be invokable on selected text or on the full note body when no selection exists.
- **FR-166**: Before display, the speed reader MUST strip YAML frontmatter, markdown syntax tokens (bold/italic markers, link URLs, image syntax, code fences, HTML comments) from the token stream while preserving readable link text and plain prose.
- **FR-167**: The speed reader MUST highlight the Optimal Recognition Point (ORP) letter in each word — approximately 30% into the word — in a user-configurable color distinct from the surrounding text.
- **FR-168**: The speed reader MUST apply natural pacing: tokens ending with sentence-ending or mid-sentence punctuation, and tokens longer than 8 characters, MUST receive an extended display pause proportional to their length or punctuation weight.
- **FR-169**: The speed reader MUST support live speed adjustment in 25 WPM steps via keyboard (`↑`/`↓`), with a minimum of 60 WPM and a maximum of 1 000 WPM; the current WPM MUST be visible in the overlay.
- **FR-170**: The speed reader MUST support 10-token skip forward (`→`) and backward (`←`), and jump-to-heading navigation, all operable without a mouse.
- **FR-171**: The speed reader MUST support a focus mode (`F`) that hides all controls and shows only the current word; the mode MUST be toggleable without interrupting playback.
- **FR-172**: Pressing `Escape` MUST close the speed reader overlay and return keyboard focus to the editor; the note body MUST remain unmodified.
- **FR-173**: Bismuth MUST detect an existing `.git` directory in the vault root on startup and activate Git integration automatically; a "Initialize repository" command MUST be available when no repo is detected.
- **FR-174**: Bismuth MUST provide a Source Control View panel listing modified, staged, and untracked files; from the panel the user MUST be able to stage or unstage individual files, write a commit message, and commit.
- **FR-175**: Bismuth MUST provide a History View listing commits with message, author, date, and changed files; selecting a commit MUST show its file list and allow opening the Diff View for any file in that commit.
- **FR-176**: Bismuth MUST provide a Diff View showing line-level unified diff for a file against the working tree or any selected commit; added lines MUST be highlighted green and removed lines red.
- **FR-177**: Bismuth MUST display editor gutter signs marking added, modified, and deleted hunks inline in the active editor; the user MUST be able to stage or reset an individual hunk directly from its gutter sign without opening the Source Control View.
- **FR-178**: Bismuth MUST provide commands to navigate between hunks in the current file (`Next hunk`, `Previous hunk`) and to stage or reset the hunk under the cursor.
- **FR-179**: Bismuth MUST support automatic commit-and-sync on a configurable interval (default: off); one cycle MUST commit all changes, pull from the configured remote, and push, entirely in a background thread that does not block the UI.
- **FR-180**: Bismuth MUST support auto-pull on startup when a remote is configured; auto-pull MUST complete before the vault is interactive or display a non-blocking progress indicator.
- **FR-181**: Bismuth MUST provide branch management commands: create branch, switch branch, and delete branch; the current branch name MUST be visible in the status bar.
- **FR-182**: Bismuth MUST provide remote management commands: add remote, edit remote, remove remote, push, pull, and clone an existing remote repository via URL and authentication prompt.
- **FR-183**: Bismuth MUST provide an "Open on GitHub" command that opens the current file or its commit history in the system browser; the command MUST show a non-blocking notice if no GitHub remote is configured.
- **FR-184**: Bismuth MUST provide an in-app `.gitignore` editor accessible from the command palette; changes MUST be saved atomically and respected by the next Git operation.
- **FR-185**: Bismuth MUST support a configurable homepage that is opened automatically on every vault startup; homepage types MUST include: specific note, canvas, saved workspace, random file, graph view, daily note, and periodic note.
- **FR-186**: A ribbon button and an "Open homepage" command MUST be available at all times to navigate to the homepage without restarting.
- **FR-187**: The startup tab behavior MUST be configurable with three options: keep existing tabs, replace the last-active note only, or close all tabs before opening the homepage.
- **FR-188**: The view mode in which the homepage opens (Reading, Source, Live Preview, or vault default) MUST be independently configurable; an option MUST exist to revert the view to vault default when the user navigates away from the homepage.
- **FR-189**: The user MUST be able to specify one or more Bismuth commands to run automatically each time the homepage finishes opening; commands MUST execute in order and failures in one MUST not block subsequent commands.
- **FR-190**: If the configured homepage note or canvas is missing at startup, Bismuth MUST display a non-blocking notice and fall back to the vault default behavior (most recent file) rather than showing an error screen.
- **FR-191**: Bismuth MUST provide a Tips manager where users can add, edit, and delete personal tip notes; each tip MUST be stored as an individual markdown file in `.bismuth/tips/` so it is version-controlled with the vault.
- **FR-192**: Tips MUST be surfaceable in three independently toggleable display surfaces: (a) a homepage widget shown when the homepage opens, (b) a startup splash overlay shown while the vault loads, and (c) a loading interstitial shown during heavy view transitions.
- **FR-193**: The tip selection mode MUST be configurable: random selection, sequential by filename (alphabetical), or sequential by creation date; in sequential mode the position MUST persist across sessions.
- **FR-194**: Each displayed tip MUST offer a "Snooze" action (configurable duration, default 7 days) that excludes the tip from selection for that duration, and a "Dismiss forever" action that excludes it permanently; both actions MUST not require opening the Tips manager.
- **FR-195**: If all tips are snoozed or dismissed and a display surface is active, Bismuth MUST silently skip the display rather than showing an empty or error state.
- **FR-196**: Tips stored in `.bismuth/tips/` MUST be plain markdown files; the Tips manager MUST render them with standard markdown formatting and allow editing them with the same editor features available in regular notes.
- **FR-197**: Bismuth MUST maintain a configurable changelog note listing recently modified vault notes in reverse-chronological order; each entry MUST follow the format `- <datetime> · [[Note Title]]` (or plain text when wiki-links are disabled).
- **FR-198**: The changelog MUST support auto-update mode (disabled by default) that rewrites the changelog note atomically within 2 seconds of any file modification, and a manual "Update changelog" command available at all times.
- **FR-199**: Changelog settings MUST include: file path (default `Changelog.md`), datetime format string (Moment.js-compatible, default `YYYY-MM-DD[T]HHmm`), maximum entry count (default 25), wiki-links on/off, optional prepended heading, and a list of excluded folder paths.
- **FR-200**: Notes inside excluded folders MUST NOT generate changelog entries; the changelog note itself MUST also be excluded from self-referential entries.
- **FR-201**: The changelog note MUST be entirely overwritten on each update; it MUST NOT be treated as a regular editable note and Bismuth MUST display a non-blocking warning if the user manually edits it while auto-update is enabled.
- **FR-202**: Bismuth MUST provide a "Recent Files" sidebar panel listing recently opened vault notes in reverse-chronological order; the list MUST update in real time as notes are opened and MUST persist across sessions.
- **FR-203**: Recent Files panel entries MUST support: click (open in current pane), Ctrl/Cmd+click (open in new pane), right-click (full file context menu), hover/Ctrl-hover (content preview popover), drag to editor (insert wikilink at drop point), drag to pane header (open in that pane), and drag to file-explorer folder (move file on disk).
- **FR-204**: The Recent Files panel MUST be configurable with: maximum entry count, excluded folder path patterns (glob), excluded frontmatter tags, and a toggle to suppress bookmarked files from appearing in the list.
- **FR-205**: If a note's frontmatter provides a display title field, the Recent Files panel MUST display that title instead of the raw filename.
- **FR-206**: The Recent Files panel MUST be available as a pinnable sidebar view, openable via command palette and ribbon, and repositionable within the same sidebar layout system as all other Bismuth panels.
- **FR-207**: Bismuth MUST provide a Connections view sidebar that displays vault notes ranked by embedding-based semantic similarity to the currently active note; the panel MUST update automatically when the user switches notes and MUST operate entirely on-device using the bundled local embedding model.
- **FR-208**: The embedding index MUST be built and maintained in the background without blocking the UI; indexing MUST be incremental (only changed files re-embedded on save) and MUST survive application restarts by caching vectors in `.bismuth/embeddings/`.
- **FR-209**: Bismuth MUST provide a Lookup view that accepts a natural language query and returns notes ranked by semantic similarity to the query intent, independently of the currently active note.
- **FR-210**: Connections view entries MUST support: click (open note), drag to editor (insert wikilink at drop point), pin (keep visible across note changes), copy as wikilink list, copy full content, and right-click (full file context menu).
- **FR-211**: The Connections view MUST support: pause/resume auto-update, a random connection command, and a configurable minimum similarity threshold below which results are hidden.
- **FR-212**: Embedding configuration MUST include: excluded folder path patterns (glob), excluded frontmatter tags, maximum displayed result count, and choice of embedding model (bundled local model or a configurable cloud API endpoint).
- **FR-213**: The `.bismuth/embeddings/` cache directory MUST be appended to the vault’s `.gitignore` automatically on first index build; if no `.gitignore` exists, Bismuth MUST create one.
- **FR-214**: Bismuth MUST provide a rich editing toolbar with three display modes — top (fixed bar above the editor), following (floating popover near cursor or selection), and tiny (compact strip) — configurable per vault.
- **FR-215**: The toolbar MUST include built-in slots for: bold, italic, underline, strikethrough, inline code, font color (with color picker), background/highlight color (with color picker), left/centre/right/justify alignment, list indent, list undent, undo, redo, horizontal rule, and heading levels H1–H6 (default Ctrl+1 through Ctrl+6).
- **FR-216**: The toolbar MUST allow any registered Bismuth command to be added as a slot; each slot MUST support a custom icon and display name; slots MUST be reorderable by drag-and-drop; slots MUST be groupable into submenus.
- **FR-217**: The toolbar MUST provide a formatting brush for font color and background color: activating it captures the styling from the current selection; subsequent selections receive that styling; right-clicking or middle-clicking anywhere deactivates the brush.
- **FR-218**: The toolbar MUST adapt icon widths proportionally to the available container width so that all configured slots remain visible on a single row without overflow, wrapping, or hidden slots.
- **FR-219**: Bismuth MUST provide two focus modes activatable from the toolbar: (a) fullscreen focus (default Ctrl+Shift+F11) that expands the editor to fill the display hiding all panels; (b) workspace fullscreen focus (default Ctrl+F11) that hides the navigator and sidebar panels only; both MUST be reversible via Escape or re-triggering the command.
- **FR-220**: The toolbar MUST render independently per editor instance and function identically in popout windows and multi-tab contexts without shared state conflicts.
- **FR-221**: Bismuth MUST provide a Typewriter Mode that can be enabled per-vault or toggled per-session via command; when active, the editor MUST keep the cursor line anchored at a configurable vertical screen position (expressed as a percentage of editor height, default 50%).
- **FR-222**: Typewriter Mode MUST include a current line highlight that visually marks only the line containing the cursor; the highlight style (background color, border) MUST be themeable via CSS variables.
- **FR-223**: Bismuth MUST support two independent focus-dimming modes: (a) paragraph dimming — all paragraphs except the one containing the cursor are rendered at a configurable reduced opacity; (b) sentence dimming — all sentences except the one containing the cursor are dimmed; each mode MUST be togglable independently.
- **FR-224**: Bismuth MUST provide a configurable maximum line length (in characters or pixels) that constrains the prose column width and centres it horizontally in the editor pane; areas outside the column MUST be non-interactive.
- **FR-225**: Bismuth MUST restore the cursor position (line and column) of each note when it is reopened; the stored position MUST persist across application restarts and be stored per note in vault-local settings.
- **FR-226**: Bismuth MUST provide a Hemingway mode that silently ignores Backspace, Delete, and any editing operation that would modify text before the current cursor position; paste MUST only be permitted when the cursor is at the very end of the current content.
- **FR-227**: Each Typewriter Mode sub-feature (scrolling, line highlight, paragraph dimming, sentence dimming, line length limit, cursor restore, Hemingway mode) MUST be independently togglable; enabling or disabling any sub-feature MUST take effect immediately without reloading the editor.
- **FR-228**: Bismuth MUST provide a LaTeX snippet engine scoped to math and text contexts; each snippet MUST define: trigger (plain text or regex), replacement (plain text or JavaScript function), mode options (text / inline-math / block-math / auto-expand / visual / word-boundary / code), optional tabstops (`$0`, `$1`, ...), optional priority, and optional description.
- **FR-229**: Bismuth MUST ship a built-in LaTeX snippet library covering Greek letters, common math operators, fractions, superscripts, subscripts, integrals, and matrix notations; users MUST be able to add, edit, disable, and delete individual snippets from a settings panel and import/export snippet sets as JSON.
- **FR-230**: Bismuth MUST provide auto-fraction expansion: typing `numerator/denominator` inside a math block (including expressions with nested parentheses as the numerator) MUST produce `\frac{numerator}{}` with the cursor in the denominator; pressing Tab MUST exit to after the closing brace.
- **FR-231**: Inside matrix environments (`matrix`, `pmatrix`, `bmatrix`, `align`, `cases`, etc.) the Tab key MUST insert `&`, the Enter key MUST insert `\\` and begin a new row, and Shift+Enter MUST move the cursor to the end of the next row.
- **FR-232**: Bismuth MUST provide a Conceal mode that replaces raw LaTeX markup with rendered Unicode symbols in Live Preview; the cursor entering a concealed expression MUST reveal its raw LaTeX; a configurable delay (default 0 ms) MAY defer the reveal to improve arrow-key navigation.
- **FR-233**: Bismuth MUST provide: (a) Tab-navigation that moves the cursor out of `$...$`, through `\left...\right` pairs, or to the next closing bracket; (b) an inline math preview popover that renders the typeset output of the math block currently containing the cursor.
- **FR-234**: Bismuth MUST provide visual snippets: with a math sub-expression selected, pressing a configured single key MUST wrap it with a macro (`\underbrace`, `\overbrace`, `\cancel`, `\cancelto`, `\underset`) and position the cursor in the argument slot.
- **FR-235**: Bismuth MUST auto-enlarge plain brackets to `\left(...\right)` when a snippet containing `\frac`, `\int`, or `\sum` fires inside them; matching brackets MUST be color-coded by nesting depth and highlighted when the cursor is adjacent to or inside the bracket pair.
- **FR-236**: Bismuth MUST expose two command-palette commands for math editing: "Box current equation" (wraps with `\boxed{...}`) and "Select current equation" (extends the editor selection to the full math block containing the cursor).
- **FR-237**: Bismuth MUST provide a Digital Garden publishing feature that generates a static website from vault notes marked with `dg-publish: true` in their frontmatter; notes without this flag MUST be excluded from the build even if linked from published notes.
- **FR-238**: The generated site MUST preserve: wikilinks (as clickable internal links), embedded images, transclusions, callouts, code blocks, MathJax equations, Mermaid/PlantUML diagrams, Dataview query results (rendered as static HTML), Canvas embeds, and Excalidraw drawings.
- **FR-239**: The site MUST include: file-tree navigator, full-text search with live preview, backlinks panel, local graph (published notes only), global graph, table of contents, and link hover previews.
- **FR-240**: The user MUST be able to apply any installed Obsidian theme to the published site; the site MUST support CSS variable customization via the Style Settings plugin and custom regex-based content filters that transform content during build (e.g., strip tags, rewrite syntax).
- **FR-241**: The site MUST be deployable to Vercel or Netlify via a one-click setup that connects the vault’s Git repository (US22); subsequent publishes MUST trigger automatic rebuilds via Git push hooks.
- **FR-242**: Bismuth MUST provide a "Publish" command that commits all changes to published notes, pushes to the configured remote, and triggers the hosting provider’s rebuild; the command MUST display build status and any errors.
- **FR-243**: Bismuth MUST provide a local preview server accessible at `http://localhost:<port>` that renders the site from the current vault state without requiring a full deploy; the preview MUST hot-reload when published notes are saved.
- **FR-244**: When a published note links to an unpublished note, the site MUST render the link as plain text or display a "not published" indicator; the unpublished note’s content MUST never be included in the build or accessible via URL.

### Non-Functional Requirements

- **NFR-001**: Editor input-to-render latency MUST remain below 16 ms (60 fps) for notes up to 50 000 words.
- **NFR-002**: File tree MUST render and respond to interactions within 100 ms for vaults up to 500 000 files using virtual rendering.
- **NFR-003**: Graph view initial render MUST complete within 3 seconds for vaults up to 10 000 nodes; pan/zoom MUST remain above 30 fps.
- **NFR-004**: Wikilink index MUST update within 500 ms of a file change.
- **NFR-005**: Bismuth MUST run on macOS (primary), Windows, and Linux without platform-specific workarounds visible to the user.
- **NFR-006**: Application startup to interactive state MUST complete within 3 seconds on a modern machine with a 10 000-file vault.
- **NFR-007**: Memory usage MUST remain below 500 MB for a 10 000-file vault under normal operation.
- **NFR-008**: All automated tests MUST pass on Windows, macOS, and Linux CI environments.
- **NFR-009**: Search index MUST be built or incrementally updated within 2 seconds for vaults up to 50 000 files on initial open.
- **NFR-010**: OCR text extraction MUST process a single image within 3 seconds on a modern machine without a GPU.
- **NFR-011**: Canvas pan/zoom interactions MUST remain above 30 fps for canvases with up to 500 nodes and 1 000 edges.
- **NFR-012**: Canvas save and reload round-trip MUST complete within 500 ms for canvases with up to 200 nodes.
- **NFR-013**: The REST API MUST respond to read endpoints (`GET`) within 100 ms for individual file operations and within 500 ms for full-vault search queries on a 50 000-file vault.
- **NFR-014**: The REST API and MCP server MUST bind exclusively to `localhost` by default; network exposure MUST require explicit user opt-in configuration.
- **NFR-015**: The API server MUST handle at least 10 concurrent authenticated connections without errors or data corruption.
- **NFR-016**: The Capture Dashboard MUST render and remain interactive for vaults with up to 10 000 unclassified notes using virtual scrolling, with initial load under 500 ms.
- **NFR-017**: Template rendering (token resolution + JavaScript execution) MUST complete within 500 ms for templates up to 200 tokens; JavaScript blocks MUST be terminated after a configurable timeout (default 2 seconds) to prevent hangs.
- **NFR-018**: Feed article lists MUST render and be interactive within 500 ms for feeds containing up to 1 000 articles using virtual scrolling.
- **NFR-019**: Feed auto-refresh MUST consume no more than 50 MB of additional memory and MUST NOT cause perceptible UI jank or frame drops during background refresh.
- **NFR-020**: All typing-triggered auto-formatting (auto-spacing, auto-pairing, rule engine `Input` rules) MUST complete within one frame (< 16 ms) to prevent perceptible input lag.
- **NFR-021**: The Navigator list pane MUST render and scroll smoothly (above 30 fps) for folders containing up to 10 000 files using virtual scrolling, with initial render under 200 ms.
- **NFR-022**: Switching between vault profiles MUST complete within 500 ms for vaults up to 50 000 files.
- **NFR-023**: The vertical tab list MUST render and remain interactive for up to 200 open tabs without perceptible lag (< 16 ms per interaction).
- **NFR-024**: Manuscript Builder Preview tab re-render MUST complete within 2 seconds of a scene save for manuscripts up to 150 000 words.
- **NFR-025**: The Radial Timeline SVG MUST render within 1 second for projects with up to 500 scenes and maintain above 30 fps during zoom and pan interactions.
- **NFR-026**: Automatic commit-and-sync MUST run entirely in a background thread; the UI MUST remain fully interactive during any Git network operation, with no frame drops exceeding 16 ms.

### Key Entities

- **Vault**: Root folder on disk containing all notes, assets, themes, plugins, and Bismuth configuration.
- **Note**: A markdown file within the vault; the primary unit of knowledge.
- **Wikilink**: A `[[Target Title]]` reference inside a note that creates a directed edge in the knowledge graph.
- **Entity**: A Note with a Portent `type` field in its YAML frontmatter, enriched with lifecycle state and typed relationships.
- **Relationship**: A `belongs_to` (primary) or `related_to` (secondary) link between two entities declared in frontmatter.
- **Tag**: A `#hashtag` or frontmatter tag attached to a note; managed globally across the vault.
- **Graph Node**: A visual representation of a note or entity in the graph view.
- **Graph Edge**: A visual representation of a wikilink or explicit relationship between two nodes.
- **Plugin**: A conforming code module placed in `plugins/` that extends Bismuth's behavior at runtime.
- **Theme**: A CSS file placed in `themes/` that overrides Bismuth's design tokens and component styles.
- **Layout**: A saved panel arrangement (sidebar, editor, graph, entity panel) persisted per vault.
- **Annotation**: An inline or sidebar comment attached to a specific text range or asset region.
- **Template**: A pre-structured note or vault scaffold (scene template, PARA, Zettelkasten, etc.).
- **SearchIndex**: A local full-text index (MiniSearch) built from all vault files including OCR-extracted image text, used to serve in-app and HTTP API search queries.
- **OCR Model**: A locally-run text extraction model applied to image files during indexing; supports a user-trained slot for custom handwriting recognition.
- **Canvas**: A `.canvas` file containing a spatial layout of nodes and edges on an infinite surface, stored as JSON Canvas format.
- **Canvas Node**: A positioned element on a canvas; may be a vault note (file node), free text, or image.
- **Canvas Edge**: A directed or undirected connection between two canvas nodes with configurable style, color, and pathfinding.
- **Canvas Group**: A named, collapsible bounding region organising related canvas nodes.
- **Portal**: A canvas node that embeds another canvas file within the current canvas surface.
- **API Server**: A locally-running HTTP server embedded in Bismuth exposing the REST API; bound to `localhost` by default, authenticated via API key.
- **API Key**: A user-generated secret token required in the `Authorization` header for all REST API and MCP requests.
- **MCP Server**: A Model Context Protocol server embedded in Bismuth exposing the same vault capabilities as the REST API to AI agents.
- **Periodic Note**: A note created on a fixed time cadence (daily, weekly, monthly, quarterly, yearly) using a configured template; managed via dedicated API endpoints.
- **Plugin Route**: A REST API route registered by a plugin via the API extension interface, served alongside built-in routes under the same authenticated server.
- **Capture Dashboard**: A dedicated inbox view listing all notes in `captured` lifecycle state, providing triage actions (type assignment, lifecycle transition, relationship connection) without leaving the view.
- **Lifecycle State**: One of three states (`captured`, `organized`, `archived`) stored in a note's YAML frontmatter; controls visibility in active vault views and dashboard inclusion.
- **Quick Capture**: A global keyboard shortcut that instantly creates a new note in `captured` state from any Bismuth view, optimized for zero-friction input.
- **Template File**: A markdown file in the vault's `templates/` directory containing `<% ... %>` tokens and optional JavaScript blocks rendered at insertion time.
- **Template Engine**: The Bismuth subsystem that parses, resolves, and renders template tokens and JavaScript blocks into a final note body at insertion time.
- **Template Module**: A namespaced built-in object available inside template expressions (e.g., `tp.file`, `tp.date`) providing vault and system metadata.
- **Template Helper**: A user-defined reusable JavaScript function stored in `templates/helpers/` and available to all template JavaScript blocks in the vault.
- **Sandbox**: An isolated JavaScript execution environment used for template code blocks; restricted from filesystem access outside the vault root, network calls, and system globals.
- **Feed**: A user-subscribed content source described by a URL pointing to an RSS, Atom, JSON, YouTube channel, or podcast feed; displayed as an article list in the Feed Dashboard.
- **Feed Article**: A single item from a feed, carrying at minimum a title, URL, published date, and summary; may have a fetchable full body.
- **Feed Folder**: A user-defined grouping for organizing feeds hierarchically within the Feed Dashboard sidebar.
- **OPML File**: An XML-format subscription list used to import and export feed collections between feed readers.
- **Save Template**: A feed-specific or global template (using Template Engine syntax) applied when saving a feed article as a vault note.
- **Typing Rule**: A user-defined or built-in transformation in the Rule Engine; one of three types (`Input`, `Delete`, `SelectKey`) with a trigger pattern, replacement, scope, and priority.
- **Tabstop**: A cursor placeholder (`$0`, `$1`, `${1:default}`) in a rule replacement that the user navigates between by pressing Tab after a rule fires.
- **Script Category**: A character-class grouping (CJK, Latin, digit, or user-defined) used by the auto-spacing system to determine where spaces should be inserted.
- **Navigator**: The two-pane file browser that replaces the default file tree; consists of the navigation pane and the list pane.
- **Navigation Pane**: The left panel of the Navigator displaying the folder tree, tag tree, and property browser in switchable tabs.
- **List Pane**: The right panel of the Navigator displaying files within the node selected in the navigation pane.
- **Vault Profile**: A named Navigator configuration storing hidden-content rules, shortcut slots, sort preferences, and an optional banner; multiple profiles enable filtered views of the same vault.
- **Shortcut Slot**: One of nine named Navigator entries (note, folder, tag, or saved search) accessible by command or keyboard shortcut.
- **Folder Note**: A designated markdown note inside a folder that represents the folder itself, openable by pressing Enter on the folder in the Navigator.
- **Navigator Cache**: A local metadata index maintained by the Navigator for fast rendering of previews, thumbnails, tags, and properties; rebuilt on demand via the Rebuild Cache command.
- **Note Sequence**: An ordered chain of notes connected by `prev` and `next` YAML frontmatter properties; each note in the chain holds a wikilink to its predecessor and/or successor.
- **Sequence Arrow**: A previous or next navigation button displayed in the note header when the open note belongs to a sequence.
- **Tab Group**: A named collection of open tabs displayed together; corresponds to a workspace split; supports four view modes (Default, Continuous, Column, Mission Control).
- **Ephemeral Tab**: An open tab that auto-replaces when a new note is opened and closes when the user navigates away; displayed in italic.
- **Tab History**: The per-tab ordered list of notes visited in that tab, navigable and bookmarkable via the right-click context menu.
- **Zen Mode**: A focus state that hides all tab groups except the one containing the active tab.
- **Writing Project**: A vault note with `bismuth-type: project` frontmatter that groups scenes and tracks overall target word count and progress.
- **Scene**: A vault note with `bismuth-type: scene` frontmatter representing a discrete unit of prose within a project; may live in any folder.
- **Sub-scene**: A vault note with `bismuth-type: sub-scene` frontmatter representing a nested prose unit within a scene.
- **Draft Snapshot**: A read-only-by-convention vault note with `bismuth-type: draft` frontmatter, created by the "New Draft" command to preserve a point-in-time copy of a scene’s prose.
- **Manuscript Preset**: A named Manuscript Builder configuration specifying scene selection, ordering, formatting options, and output format for a compile run.
- **Manuscript Preview**: The Manuscript Builder’s Preview tab rendering the current preset output as continuous read-only prose, updated automatically on scene save.
- **Branch Block**: A discrete markdown segment within a note managed by the Branching Block Editor; identified by a visible HTML-comment marker storing its ID, parent, and order.
- **Branch Tree**: The hierarchical structure of Branch Blocks within a single note, rendered left-to-right in the Branching Block Editor view.
- **Block Metadata Comment**: A hidden base64-encoded JSON HTML comment at the end of a branching-managed note, storing the full block tree for fast recovery.
- **Timeline Grammar**: One of four modes (Narrative, Chronologue, Progress, Gossamer) that determine how scenes are positioned and colored in the Radial Story Timeline.
- **Subplot Ring**: A concentric ring in the Radial Story Timeline representing a single subplot; scenes on that ring are positioned by the active timeline grammar.
- **Revision Stage**: A scene’s manuscript maturity level (`bismuth-revision-stage`): Zero Draft, First Draft, Revised, Final, or Press-ready; used by Gossamer mode.
- **RSVP Token**: A single word or punctuation-delimited unit presented in the Speed Reader overlay; derived from the note body after markdown and frontmatter stripping.
- **Optimal Recognition Point (ORP)**: The single letter within an RSVP token highlighted in a distinct color to anchor the eye; positioned at approximately 30% into the token.
- **Git Repository**: A vault with an initialized `.git` directory; the unit of version-controlled storage for all vault files.
- **Commit**: A Git snapshot of all staged changes; carries a message, author, and timestamp.
- **Gutter Sign**: An inline editor margin indicator marking an added, modified, or deleted hunk in the active file; actionable for staging or resetting the hunk.
- **Hunk**: A contiguous block of added or removed lines in a diff; the smallest unit that can be independently staged or reset.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open a vault, create a note, write 1 000 words, and navigate to another note in under 60 seconds on first use with no training.
- **SC-002**: Editor input-to-render latency is below 16 ms (60 fps) for notes up to 50 000 words, measured via automated render timing tests.
- **SC-003**: Graph view renders a 10 000-node vault in under 3 seconds and sustains 30 fps during pan/zoom, measured by automated performance tests.
- **SC-004**: Wikilink index updates within 500 ms of a file save, measured by automated file-watch timing tests.
- **SC-005**: Automated tests maintain at least 90% coverage for lines, branches, statements, and functions across all code files.
- **SC-006**: Primary workflows (vault open, note create/edit, graph view, entity panel, export) pass automated validation on Windows, macOS, and Linux.
- **SC-007**: A custom CSS theme file is applied to all editor surfaces within one restart cycle, verified by visual regression tests.
- **SC-008**: A conforming plugin is loaded at startup and its registered contributions appear in the UI within one restart cycle, verified by automated integration tests.
- **SC-009**: Static site export produces a valid, deployable Svelte site with all wikilinks resolved, verified by automated build and link-check tests.
- **SC-010**: Memory usage remains below 500 MB for a 10 000-file vault after 30 minutes of normal operation, measured by automated memory profiling.
- **SC-011**: Search returns results within 200 ms for a 50 000-file vault query, measured by automated search latency tests.
- **SC-012**: Search index builds or updates incrementally within 2 seconds on vault open for a 50 000-file vault, measured by automated index timing tests.
- **SC-013**: A canvas with 200 nodes and 400 edges pans and zooms above 30 fps, measured by automated canvas render tests.
- **SC-014**: The HTTP search API returns valid JSON for a well-formed query while Bismuth is running, verified by automated integration tests.
- **SC-015**: OCR text from a standard-resolution image is indexed and retrievable by search within 3 seconds of indexing, verified by automated OCR integration tests.
- **SC-016**: A full CRUD cycle (create, read, patch heading, delete) on a vault note via the REST API completes correctly and is verified by automated HTTP integration tests on Windows, macOS, and Linux.
- **SC-017**: A path-traversal request (e.g., `../../etc/passwd`) to any API endpoint returns HTTP 400 or 403 and reads no file outside the vault root, verified by automated security tests.
- **SC-018**: An MCP-compatible AI agent can create, read, and modify a vault note using standard MCP tool calls, verified by an automated MCP client integration test.
- **SC-019**: The REST API returns HTTP 401 for every endpoint when called without a valid API key, with zero vault data in the response body, verified by automated authentication tests.
- **SC-020**: The Capture Dashboard lists all captured notes correctly and removes a note from the inbox within one render cycle after its lifecycle state is advanced to `organized`, verified by automated UI integration tests.
- **SC-021**: Quick-capture creates a new note with correct frontmatter and places the cursor within 200 ms of the shortcut, measured by automated timing tests.
- **SC-022**: A note with `archived: true` does not appear in the file tree, graph view, or tag panel in any automated UI state test, but IS returned by a direct search query for its title.
- **SC-023**: A template containing `tp.file.title`, `tp.file.creation_date()`, and `tp.date.now("YYYY-MM-DD", -1)` resolves all tokens correctly on insertion with no residual `<% %>` syntax, verified by automated template rendering tests.
- **SC-024**: A template JavaScript block that attempts to access `process`, `require`, or any network API is blocked by the sandbox and returns an error token, verified by automated sandbox security tests.
- **SC-025**: A JavaScript block that exceeds the 2-second timeout is terminated and the insertion is aborted with an inline error message, verified by automated timeout tests.
- **SC-026**: A valid RSS feed URL is added to the Feed Dashboard and its articles appear within 5 seconds, verified by automated integration tests using a local mock feed server.
- **SC-027**: Saving a feed article creates a vault note with the correct save-template frontmatter and lifecycle state `captured`, verified by automated integration tests.
- **SC-028**: An OPML file with 50 feeds in nested folders is imported, producing the correct feed list and folder structure, and re-exported OPML matches the import structure, verified by automated round-trip tests.
- **SC-029**: Auto-spacing is inserted between a CJK character and an adjacent Latin character within one keypress, with no input lag exceeding 16 ms, verified by automated editor timing tests.
- **SC-030**: A custom `Input` rule with a regex trigger and tabstop placeholder fires correctly, replaces the trigger text, and positions the cursor at `$0` on the first Tab, verified by automated rule engine tests.
- **SC-031**: A JSON export of all custom rules re-imported into a fresh vault produces an identical rule set (same triggers, replacements, priorities, and scopes), verified by automated import/export round-trip tests.
- **SC-032**: The Navigator list pane renders a folder containing 10 000 notes within 200 ms and maintains above 30 fps during keyboard navigation, measured by automated render timing tests.
- **SC-033**: A filter search query combining a tag, a property filter, and a date range returns only notes matching all three predicates, verified by automated search tests against a fixture vault.
- **SC-034**: Switching between two vault profiles updates the visible folders, tags, and notes within 500 ms with no stale content from the previous profile, verified by automated profile-switch tests.
- **SC-035**: Inserting a note into a three-note sequence (A↔B↔C, inserting D between B and C) produces correct reciprocal `prev`/`next` frontmatter in all four notes atomically, verified by automated frontmatter inspection tests.
- **SC-036**: Deleting a sequence note by any means (command, Navigator delete, OS file deletion) triggers automatic reconnection of its neighbors, verified by automated file-watch and frontmatter inspection tests.
- **SC-037**: With 20 open tabs in two named groups, switching a group to Continuous view renders all tabs in that group as a single scrollable document with no missing content, verified by automated render tests.
- **SC-038**: Tab deduplication redirects focus to an existing open tab when the same note is opened a second time, with zero duplicate tabs created, verified by automated tab-state tests.
- **SC-039**: Running "New Draft" on a scene with existing prose creates a valid draft snapshot file and a new working-draft file with correctly incremented `draft-version` frontmatter, verified by automated frontmatter inspection tests.
- **SC-040**: A Manuscript Builder preset with three scenes exports a valid `.docx` file containing all scene prose in preset order, verified by automated DOCX structure inspection tests.
- **SC-041**: A Scrivener 3 `.scriv` bundle import produces correctly typed frontmatter notes for all chapters and scenes, with no RTF markup or binary artifacts in note bodies, verified by automated import integration tests.
- **SC-042**: After creating a three-level branch tree (root → child → grandchild), switching to standard markdown view and back preserves the full tree structure with all block markers intact, verified by automated round-trip tests.
- **SC-043**: Dragging a block with two descendants to become a child of a sibling block updates the markdown body atomically with correct parent IDs and order values for all three affected blocks, verified by automated block-marker inspection tests.
- **SC-044**: Opening the Radial Timeline for a project with 10 scenes across 3 subplots renders all scenes in the correct ring positions in Narrative mode within 1 second, verified by automated SVG structure inspection tests.
- **SC-045**: Switching between all four grammar modes updates scene positions and colors without any scene being omitted or duplicated, verified by automated mode-switch tests.
- **SC-046**: A 500-word note with bold, wikilinks, frontmatter, and a code fence produces a clean RSVP token stream containing only readable words (no markdown syntax characters), verified by automated tokenization unit tests.
- **SC-047**: Staging one file and committing from the Source Control View creates a Git commit that appears in the History View with the correct message and file list, verified by automated Git log inspection tests.
- **SC-048**: With auto commit-and-sync enabled, modifying a note and waiting for the configured interval results in a new commit appearing in the local Git log within 5 seconds of the interval expiry, verified by automated Git log polling tests.
- **SC-049**: With homepage set to a specific note and tab behavior "close all", launching Bismuth with two prior open tabs results in exactly one tab open (the homepage) in the configured view mode, verified by automated startup state inspection tests.
- **SC-050**: With three tips stored and random mode enabled, opening the homepage widget five times produces tip display each time with no empty-widget renders, and snoozed tips are excluded from selection for the configured snooze duration, verified by automated tip-selection unit tests.
- **SC-051**: Modifying three notes in sequence with auto-update enabled results in a changelog note containing exactly three entries in reverse-chronological order with correct wikilinks; a note in an excluded folder produces no entry, verified by automated file-watch and changelog content inspection tests.
- **SC-052**: Opening ten notes in sequence and then enabling a folder exclusion matching three of them results in exactly seven entries in the Recent Files panel listed newest-first; a Ctrl/Cmd+click on any entry opens the note in a new pane without disturbing the active view, verified by automated panel state inspection tests.
- **SC-053**: Given a curated test vault of 50 notes where 10 are thematically related to a seed note with no shared keywords or wikilinks, opening the seed note and checking the Connections view surfaces at least 3 of the 10 related notes in the top 5 results using only the local embedding model with no network access, verified by automated similarity scoring tests against a labeled ground-truth note set.
- **SC-054**: With the toolbar in following mode, selecting text causes the toolbar to appear within one frame (< 16 ms); reordering two slots and restarting Bismuth shows the new order; applying the formatting brush to three different text ranges colors all three correctly; triggering fullscreen focus hides all panels and Escape restores them, verified by automated editor state and DOM inspection tests.
- **SC-055**: With typewriter scrolling at 50%, paragraph dimming at 30% opacity, and Hemingway mode enabled, typing 20 lines in a 500-word note keeps the cursor within 2 px of the vertical midpoint throughout; all non-active paragraphs render at 30% opacity; pressing Backspace produces no character deletion; closing and reopening the note restores the cursor to the correct line and column, verified by automated editor geometry and DOM opacity inspection tests.
- **SC-056**: Typing `@a` inside a display math block expands immediately to `\alpha`; typing `a/b` produces `\frac{a}{}` with cursor in denominator; enabling Conceal renders `\sqrt{x}` as `√{x}` in the editor and reveals raw LaTeX on cursor entry; pressing Tab at the end of `$x^{2}$` moves the cursor outside the delimiters; a visual snippet wraps a selected expression with `\underbrace` correctly, all verified by automated editor state and DOM content inspection tests.
- **SC-057**: Marking three notes with `dg-publish: true` and running the local preview server produces a site at `localhost:<port>` with all three notes accessible via wikilinks, a working search bar, and a file-tree navigator; removing the flag from one note and rebuilding removes it from the site and marks its incoming links as unpublished, verified by automated HTTP request tests and HTML structure inspection.

---

## Assumptions

- The vault is a folder on the user's local file system; Bismuth does not own or manage the storage format beyond its own config files.
- Markdown (CommonMark) is the primary content format; structured data (entity metadata, tag indexes) is stored in YAML frontmatter or sidecar files (format to be decided in planning: YAML, JSON, or SQLite index).
- [NEEDS CLARIFICATION: Runtime host — should Bismuth be delivered as a native desktop application (e.g., Tauri/Rust backend + web frontend) or a pure web stack (Electron, browser app)? This is the highest-impact architectural decision: web stack enables CSS theming and cross-platform reach but risks performance on large vaults; a native shell (Tauri) can provide both native file I/O speed and web-based UI. Prioritizing macOS, what is the acceptable build complexity trade-off?]
- [NEEDS CLARIFICATION: Data format for structured/tabular data — the user mentioned CSV, JSON, or another format as a "second source of truth" alongside markdown. Which format should be canonical for entity metadata, tag indexes, and graph data? Options: YAML frontmatter only (simple, human-readable), sidecar JSON files per note, or a local SQLite index (fast queries, not human-readable). This choice affects the entity system, graph rendering, and backup story.]
- Plugin authors are expected to fork the repository and submit a PR; Bismuth does not need a marketplace or remote plugin install in v1.
- CSS is the theming format regardless of the underlying runtime host, since the UI is web-rendered.
- **Bismuth’s UI foundation MUST be visually and structurally compatible with Obsidian themes and component patterns** to minimize friction for users migrating from Obsidian and to leverage the existing theme ecosystem; the component library and CSS variable naming SHOULD follow Obsidian’s conventions (e.g., `--background-primary`, `--text-normal`, workspace leaf/split architecture) where feasible; Tolaria (https://github.com/refactoringhq/tolaria) is referenced as prior art for an Obsidian-like React/TypeScript component foundation and MAY be used as a starting point or design reference during planning.
- "Write-good" linting is based on the `write-good` open-source library (or an equivalent local model); no remote API calls are required.
- Concept link suggestions are computed locally using an inverted index over note titles; semantic similarity matching (stretch goal) would require a local embedding model and is out of scope for v1.
- Web publishing defaults to Svelte static site generation; Vue is a secondary option selectable by the user.
- Locally hosted means all data stays on disk; online publishing is opt-in via Git Pages and requires a GitHub account only for that feature.
- Mobile support is out of scope for v1.
- The Tolaria reference is used for design inspiration only; no code from Tolaria is imported.
- MiniSearch is the chosen local search library; BM25 ranking is provided via MiniSearch's scoring configuration. No remote search service is used.
- OCR in v1 uses a bundled open-source model (e.g., Tesseract or equivalent) for printed text. The user-trained handwriting model is a plug-in slot: the interface is defined in v1 but model training tooling is a separate workstream outside this spec.
- The local HTTP search server binds to `localhost` only and is not exposed to the network without explicit user configuration.
- Canvas format is based on the open JSON Canvas specification (https://jsoncanvas.org/) extended with Bismuth metadata in a namespaced key; this ensures interoperability with other JSON Canvas tools.
- Spec files are organized by change type under `specs/<type>/` (e.g., `specs/feature/`, `specs/docs/`, `specs/fix/`); the numbering sequence is per type directory.
- The REST API and MCP server run in-process within Bismuth (not as a separate daemon) and shut down with the application.
- The API key is stored in the vault's local config directory (never committed to version control) and can be regenerated by the user at any time.
- Interactive API documentation (similar to the Obsidian Local REST API docs at https://coddingtonbear.github.io/obsidian-local-rest-api/) is a stretch goal for v1; a static OpenAPI schema MUST be generated and bundled.
- The MCP server implementation follows the MCP specification version current at the time of planning; the spec version is to be confirmed in the implementation plan.
- Browser-based web clipping is out of scope for v1 as a bundled feature; the REST API (FR-034, FR-045) provides the interface for a browser extension to POST clips into the vault inbox. A reference browser extension may be documented as a stretch goal.
- Lifecycle state is stored in YAML frontmatter using the two-field form (`organized: bool`, `archived: bool`) as described in the Portent spec; a single `status` field is an accepted alternative and both forms MUST be recognized.
- Template token delimiters are `<% ... %>` for expressions and `<%* ... %>` for JavaScript blocks by default; the delimiter pair is configurable per vault but MUST NOT conflict with standard markdown syntax.
- Network-calling template functions (analogous to `tp.web.*`) are out of scope for v1; any web-fetching helper defined by a user in `templates/helpers/` falls under the sandbox restriction and MUST NOT make network calls.
- Template rendering is synchronous from the user's perspective; async JavaScript inside a block is awaited up to the configured timeout, then terminated.
- Feed fetching is explicitly user-initiated (user adds a feed URL); it is the one category of outbound network request that is permitted by the local-first principle because the user has chosen to subscribe to an external source.
- Twitter/X feed support via Nitter RSS proxy URLs is a stretch goal for v1 due to Nitter instance instability; the feed parser MUST handle it gracefully if a valid Nitter RSS URL is provided, but Bismuth MUST NOT bundle or operate a Nitter proxy.
- Full-text article fetching may fail due to paywalls, bot detection, or network errors; in all failure cases Bismuth MUST fall back to the feed-provided summary and display a non-blocking notice.
- Podcast audio playback uses the platform's native audio capabilities; a built-in podcast player UI (play/pause/seek/speed) is in scope but advanced features (chapters, transcription) are stretch goals.
- Feed data (articles, read state, starred status) is stored locally in the vault's config directory, not in individual markdown files, to avoid polluting the note namespace.
- Auto-formatting is disabled by default in code blocks and formula blocks to avoid corrupting syntax; the user can enable it per-scope via Rule Engine scope settings.
- IME compatibility (Chinese, Japanese, Korean input method composition) is handled by deferring auto-formatting until the IME commits the composed character, not on each keystroke during composition.
- The Rule Engine JavaScript sandbox is shared with the Template Engine sandbox (FR-065); the same restrictions (no filesystem escape, no network, no system globals, 2-second timeout) apply to rule function replacements.
- The Navigator metadata cache is stored locally in the vault’s config directory (not in vault notes); it is a derived index and can always be rebuilt from the vault file system.
- Thumbnail generation for note previews is performed lazily (on first view) and cached; external image downloads for featured images are opt-in per vault profile.
- The Navigator public plugin API (FR-112) follows the same versioning contract as the REST API plugin route extension (FR-054); breaking changes require a major version bump.
- The default Notebook Navigator layout is dual-pane on desktop and single-pane on any platform where the viewport width is below a configurable breakpoint.
- Sequence `prev`/`next` values are stored as standard wikilink strings (`"[[Note Title]]"`) in YAML frontmatter; they are recognized by the wikilink index (FR-005) and appear in the graph view and backlinks panel as directed edges.
- Cycle detection in sequences (A→B→A) is a warning, not an error; Bismuth MUST display a non-blocking notice when a cycle is detected but MUST NOT prevent the user from creating it.
- The sequence note picker uses the same search index as the unified search panel (US8) for fast note lookup.
- Tab group workspace splits are the underlying persistence mechanism for tab groups; the vertical tab list is a UI projection of that structure and does not introduce a separate data store.
- Ephemeral tab behavior is disabled by default; users opt in per vault.
- Tab deduplication scope defaults to all tabs in all groups; users can narrow to same-group only or expand to include sidebar and popup tabs in settings.
- Long-form project frontmatter uses the `bismuth-` namespace prefix; this is distinct from the `dbench-` prefix used by Draft Bench for Obsidian and is Bismuth’s own convention.
- Draft snapshot files are conventional read-only (no enforced lock); Bismuth MUST warn but not block if a user edits a snapshot file directly.
- Scrivener import is cross-platform; the wizard MUST function on macOS, Windows, and Linux without requiring Scrivener to be installed.
- PDF export uses a bundled renderer (e.g., pdfmake or equivalent); the font and page-size defaults are configurable per preset but no custom font upload UI is required in v1.
- DOCX export uses a bundled open-source library (e.g., docx.js or equivalent); Track Changes and advanced DOCX styles are out of scope for v1.
- Branching block markers are HTML comments and are invisible in standard markdown rendered output; they do not affect the note’s readability when the plugin is disabled.
- The branching view is desktop-only in v1; mobile layout is a stretch goal.
- Block granularity (what constitutes a block boundary) defaults to paragraph breaks; fenced code blocks, blockquotes, and front matter are treated as atomic blocks and are never split.
- The Radial Timeline is a read-only visualization; scene frontmatter can only be edited by opening the scene note, not from within the timeline view in v1.
- The SVG rendering engine uses D3.js or an equivalent data-driven SVG library; the specific library choice is deferred to the technology section of the implementation plan.
- `bismuth-narrative-order` and `bismuth-chrono-order` are integer fields; equal values in the same ring are allowed and result in co-positioned arcs rendered with a slight angular offset to remain distinguishable.
- The speed reader does not modify the note; it is a read-only overlay operating on a pre-processed in-memory token stream.
- If the token stream after stripping produces fewer than 3 tokens, the speed reader MUST display a non-blocking notice and not open the overlay.
- Git integration requires a system Git installation on desktop; Bismuth does not bundle a Git binary and MUST display a clear setup notice if Git is not found on `PATH`.
- Auto commit-and-sync is disabled by default; users opt in and configure the interval per vault.
- The auto-sync commit message is configurable; the default template is `vault backup: {{date}}`.
- The homepage configuration is stored per-vault in the vault settings directory, not globally; different vaults can have different homepages.
- The "Random file" homepage type excludes files in the vault config directory (`.bismuth/`) and files matching the vault's `.gitignore` patterns.
- Tips are stored in `.bismuth/tips/`; this directory is excluded from vault-wide search (US8) and the Navigator (US15) by default to avoid cluttering results, but can be un-excluded in settings.
- Snooze and dismiss state is tracked in a lightweight sidecar file (`.bismuth/tips/.state.json`) alongside the tip files; this file is also version-controlled.
- The changelog note is a plain markdown file; it is excluded from the changelog itself (FR-200) and from vault-wide search result ranking to prevent it from dominating recency signals.
- The datetime format string follows Moment.js conventions; the default `YYYY-MM-DD[T]HHmm` produces entries like `2026-05-25T1748`.
- The Recent Files list is stored in vault-level settings (`.bismuth/`) so it is vault-specific; switching vaults shows only that vault's recents, never cross-vault entries.
- LaTeX snippet JavaScript function replacements are executed in the same sandbox as US12 (Template Engine) and US14 (Typing Rule Engine); they MUST NOT make network calls, access the file system, or import external modules.
- Digital Garden publishing uses a static site generator (e.g., Eleventy, Astro, or a custom build pipeline); the choice is deferred to planning but MUST support hot-reload during local preview and one-click Vercel/Netlify deploy.
- Published sites are entirely static HTML/CSS/JS with no server-side rendering or database; search is client-side using a prebuilt index (e.g., Lunr.js or MiniSearch).
- The bundled local embedding model is a quantized open-source sentence embedding model (e.g., a WASM-compiled variant of all-MiniLM-L6-v2 or equivalent); cloud API model selection (OpenAI, Gemini, etc.) is configurable as an opt-in and MUST require explicit user action to enable.
- Embedding vectors stored in `.bismuth/embeddings/` are vault-local and never transmitted; the directory is excluded from Git tracking by default (FR-213).
