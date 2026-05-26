# GitHub Wiki Structure for Bismuth

This document outlines the structure for the Bismuth GitHub Wiki. The wiki will be created at:
`https://github.com/yeabsiraretta/bismuth.wiki.git`

---

## 📋 Wiki Organization

The wiki is organized into four main sections:

1. **User Guide** - For end users of Bismuth
2. **Developer Guide** - For contributors and developers
3. **Architecture** - System design and technical decisions
4. **Processes** - Project management and workflows

---

## 📖 User Guide Section

### Home (Landing Page)
**File**: `Home.md`

Welcome page with:
- What is Bismuth?
- Quick navigation
- Getting started links
- Key features overview

### Getting Started
**File**: `Getting-Started.md`

- Installation instructions (macOS, Windows, Linux)
- Creating your first vault
- Basic note-taking
- Understanding the interface
- First steps tutorial

### Core Features

**File**: `Note-Taking.md`
- Creating notes
- Markdown syntax
- Frontmatter metadata
- Note properties

**File**: `Wikilinks.md`
- Creating wikilinks
- Link syntax variations
- Backlinks
- Unlinked mentions

**File**: `Graph-View.md`
- Understanding the graph
- Navigation controls
- Filtering options
- Graph customization

**File**: `Search.md`
- Basic search
- Advanced search syntax
- Search operators
- Search in files

**File**: `Tags.md`
- Creating tags
- Tag hierarchy
- Tag pane
- Tag search

### Organization Systems

**File**: `Johnny-Decimal.md`
- What is Johnny.Decimal?
- Area-Category-ID structure
- Setting up your system
- Best practices
- Examples

**File**: `Zettelkasten.md`
- What is Zettelkasten?
- Atomic notes
- Linking strategy
- Structure notes
- Workflow examples

**File**: `Folders-and-Structure.md`
- Vault organization
- Folder best practices
- File naming conventions
- Moving and organizing notes

### Customization

**File**: `Themes.md`
- Installing themes
- Creating custom themes
- CSS variables
- Theme compatibility

**File**: `Settings.md`
- General settings
- Editor settings
- File settings
- Appearance settings

**File**: `Keyboard-Shortcuts.md`
- Default shortcuts
- Custom shortcuts
- Shortcut reference table
- Platform-specific shortcuts

**File**: `Templates.md`
- Creating templates
- Using templates
- Template variables
- Template examples

### Advanced Features

**File**: `Frontmatter.md`
- YAML syntax
- Common properties
- Custom properties
- Dataview integration

**File**: `Embeds.md`
- Embedding notes
- Embedding images
- Embedding PDFs
- Block embeds

**File**: `PDF-Annotation.md`
- Opening PDFs
- Highlighting
- Annotations
- Linking to highlights

**File**: `Export.md`
- Export formats
- Export settings
- Batch export
- Publishing options

### Help & Support

**File**: `Troubleshooting.md`
- Common issues
- Error messages
- Performance problems
- Platform-specific issues

**File**: `FAQ.md`
- General questions
- Feature questions
- Technical questions
- Comparison with other tools

**File**: `Tips-and-Tricks.md`
- Power user features
- Workflow optimizations
- Hidden features
- Community tips

---

## 🛠️ Developer Guide Section

### Developer Home
**File**: `Developer-Guide.md`

Overview of:
- Development setup
- Tech stack
- Architecture overview
- Contribution workflow

### Getting Started

**File**: `Development-Setup.md`
- Prerequisites
- Installing dependencies
- Running dev server
- Building for production
- Troubleshooting setup

**File**: `Project-Structure.md`
- Directory layout
- Frontend structure
- Backend structure
- Test organization
- Documentation structure

**File**: `Tech-Stack.md`
- Frontend technologies
- Backend technologies
- Build tools
- Testing frameworks
- CI/CD tools

**File**: `First-Contribution.md`
- Finding issues
- Setting up environment
- Making changes
- Running tests
- Submitting PR

### Frontend Development

**File**: `Frontend-Guide.md`
- Svelte architecture
- Component structure
- State management
- Routing
- Styling approach

**File**: `Components.md`
- Component library
- Creating components
- Component props
- Component events
- Reusable patterns

**File**: `State-Management.md`
- Svelte stores
- Global state
- Local state
- Derived stores
- Store best practices

**File**: `Styling.md`
- CSS architecture
- Theme system
- CSS variables
- Responsive design
- Accessibility

### Backend Development

**File**: `Backend-Guide.md`
- Rust architecture
- Module structure
- Error handling
- Async patterns
- Best practices

**File**: `Tauri-Commands.md`
- Creating commands
- Command patterns
- Error handling
- Type safety
- Testing commands

**File**: `File-System.md`
- Vault operations
- File watching
- Path handling
- Permissions
- Cross-platform considerations

**File**: `Database.md`
- SQLite schema
- Migrations
- Queries
- Transactions
- Performance

### API & Integration

**File**: `API-Reference.md`
- Complete API documentation
- Command reference
- Event reference
- Type definitions
- Examples

**File**: `Events.md`
- Event system
- Creating events
- Listening to events
- Event patterns
- Debugging events

**File**: `Plugins.md`
- Plugin architecture
- Creating plugins
- Plugin API
- Plugin examples
- Publishing plugins

### Quality & Testing

**File**: `Testing-Guide.md`
- Testing philosophy
- Unit tests
- Integration tests
- E2E tests
- Test coverage

**File**: `Code-Quality.md`
- Linting rules
- Formatting standards
- Code review process
- Static analysis
- Performance profiling

**File**: `Debugging.md`
- Frontend debugging
- Backend debugging
- Tauri DevTools
- Logging
- Common issues

**File**: `Performance.md`
- Performance goals
- Profiling tools
- Optimization techniques
- Memory management
- Benchmarking

### Build & Release

**File**: `Build-Process.md`
- Development builds
- Production builds
- Platform-specific builds
- Code signing
- Troubleshooting builds

**File**: `Release-Process.md`
- Versioning strategy
- Changelog generation
- Creating releases
- Distribution
- Update mechanism

**File**: `CI-CD.md`
- GitHub Actions workflows
- Automated testing
- Build automation
- Release automation
- Deployment

---

## 🏗️ Architecture Section

### Architecture Home
**File**: `Architecture.md`

Overview of:
- System design
- Key decisions
- Technology choices
- Design principles

### Core Architecture

**File**: `System-Design.md`
- High-level architecture
- Component diagram
- Data flow
- Communication patterns
- Scalability considerations

**File**: `Data-Model.md`
- Core entities (Note, Vault, Link)
- Relationships
- Data structures
- Serialization
- Validation

**File**: `File-System-Design.md`
- Vault structure
- File organization
- Metadata storage
- Indexing strategy
- Sync considerations

**File**: `IPC-Layer.md`
- Tauri IPC architecture
- Command patterns
- Event patterns
- Error propagation
- Type safety

**File**: `State-Management-Architecture.md`
- Frontend state
- Backend state
- State synchronization
- Persistence
- Caching

### Subsystems

**File**: `Database-Design.md`
- Schema design
- Indexing strategy
- Query optimization
- Migration strategy
- Backup and recovery

**File**: `Search-Engine.md`
- Tantivy integration
- Indexing pipeline
- Query processing
- Ranking algorithm
- Performance optimization

**File**: `Graph-Engine.md`
- Graph data structure
- Layout algorithms
- Rendering pipeline
- Interaction handling
- Performance optimization

**File**: `Theme-System.md`
- CSS architecture
- Variable system
- Theme loading
- Compatibility layer
- Custom themes

### Architecture Decisions

**File**: `ADR-Index.md`
- List of all ADRs
- Decision categories
- Status tracking

**File**: `ADR-001-Tech-Stack.md`
- Context
- Decision
- Consequences
- Status

**File**: `ADR-002-Local-First.md`
- Context
- Decision
- Consequences
- Status

*(Continue with more ADRs as needed)*

---

## 📋 Processes Section

### Processes Home
**File**: `Processes.md`

Overview of:
- Project management
- Contribution process
- Release process
- Communication

### Contributing

**File**: `Contributing.md`
- Code of conduct
- How to contribute
- Issue guidelines
- PR guidelines
- Review process

**File**: `Git-Workflow.md`
- Branch naming
- Commit messages
- PR process
- Merge strategy
- Release branches

**File**: `Versioning.md`
- Semantic versioning
- Version bumping
- Changelog
- Breaking changes
- Deprecation policy

### Project Management

**File**: `Status.md`
- Current phase
- Progress metrics
- Completed tasks
- Upcoming tasks
- Blockers

**File**: `Roadmap.md`
- Vision
- Phases
- Milestones
- Feature timeline
- Release schedule

**File**: `Assets-Tracker.md`
- Visual assets
- Configuration files
- Documentation
- Design specs
- Sample content

### Communication

**File**: `Issue-Templates.md`
- Bug report template
- Feature request template
- Documentation template
- Question template

**File**: `PR-Templates.md`
- Standard PR template
- Checklist
- Review guidelines

---

## 📝 Wiki Maintenance

### Creating Wiki Pages

1. Clone the wiki repository:
   ```bash
   git clone https://github.com/yeabsiraretta/bismuth.wiki.git
   ```

2. Create/edit markdown files following the structure above

3. Use kebab-case for filenames: `Getting-Started.md`

4. Commit and push:
   ```bash
   git add .
   git commit -m "docs: add getting started guide"
   git push origin master
   ```

### Wiki Guidelines

- **File naming**: Use `Title-Case-With-Hyphens.md`
- **Internal links**: Use `[[Page Title]]` syntax
- **External links**: Use standard markdown `[text](url)`
- **Images**: Store in wiki repo, reference with relative paths
- **Code blocks**: Always specify language for syntax highlighting
- **Tables**: Use for structured data
- **Headings**: Use H2-H4, reserve H1 for page title

### Sidebar Configuration

Create `_Sidebar.md` with navigation:

```markdown
**User Guide**
- [[Home]]
- [[Getting Started]]
- [[Note Taking]]
- [[Wikilinks]]
- [[Graph View]]

**Developer Guide**
- [[Developer Guide]]
- [[Development Setup]]
- [[API Reference]]
- [[Testing Guide]]

**Architecture**
- [[Architecture]]
- [[System Design]]
- [[Data Model]]

**Processes**
- [[Contributing]]
- [[Roadmap]]
- [[Status]]
```

### Footer Configuration

Create `_Footer.md`:

```markdown
[Home](Home) | [User Guide](User-Guide) | [Developer Guide](Developer-Guide) | [GitHub](https://github.com/yeabsiraretta/bismuth)

---

© 2026 Bismuth PKM Editor | [MIT License](https://github.com/yeabsiraretta/bismuth/blob/main/LICENSE)
```

---

## 🔄 Sync with Repository

### Documentation in Repository

Keep these in `/docs`:
- Technical architecture documents
- Implementation status
- Asset tracker
- Development guides specific to codebase

### Documentation in Wiki

Move these to wiki:
- User-facing documentation
- Getting started guides
- Feature documentation
- FAQ and troubleshooting

### Cross-References

- Link from README.md to wiki
- Link from wiki to specific code files
- Link from code comments to wiki pages
- Keep documentation synchronized

---

## ✅ Migration Checklist

- [ ] Create wiki repository
- [ ] Set up sidebar and footer
- [ ] Create Home page
- [ ] Migrate user guide content
- [ ] Migrate developer guide content
- [ ] Create architecture documentation
- [ ] Document processes
- [ ] Add screenshots and diagrams
- [ ] Update README.md links
- [ ] Archive old documentation
- [ ] Announce wiki to community

---

**Last Updated**: 2026-05-25  
**Maintainer**: Yeabsira Moges
