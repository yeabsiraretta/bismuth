# UX/UI Principles for Bismuth

Research-backed UX/UI principles organized into 6 parts. Apply these during design and code review.

## Framework Overview

| Part   | Domain                   | Application in Bismuth                                  |
| ------ | ------------------------ | ------------------------------------------------------- |
| Part 1 | Cognitive Foundations    | Vault navigation, note organization, search results     |
| Part 2 | Visual Design            | Editor layout, sidebar hierarchy, graph visualization   |
| Part 3 | Interaction Design       | Wikilink clicks, auto-save feedback, keyboard shortcuts |
| Part 4 | Information Architecture | File tree structure, tag hierarchy, navigation patterns |
| Part 5 | AI & Emerging            | Future AI features, smart suggestions, automation       |
| Part 6 | Human-Centered           | Accessibility, dark mode, error messages, trust signals |

---

## Part 1: Cognitive Foundations

### F.1.1.02 - Cognitive Load

**Principle**: Limit simultaneous information to 7±2 items (Miller's Law)

**In Bismuth**:

- ✅ **File tree**: Show max 7-9 top-level folders before scrolling
- ✅ **Search results**: Paginate at 10 results per page
- ❌ **Avoid**: Showing 20+ tags in sidebar without grouping
- ❌ **Avoid**: 15+ toolbar buttons visible at once

**Code Example**:

```typescript
// ❌ Bad: Too many options
const toolbarButtons = [/* 15 buttons */];

// ✅ Good: Grouped with progressive disclosure
const primaryActions = [/* 5 buttons */];
const moreActions = [/* 10 buttons in dropdown */];
```

### F.2.2.03 - Hick's Law

**Principle**: Decision time increases logarithmically with number of choices

**In Bismuth**:

- ✅ **Navigation**: Keep main nav to 5-7 items
- ✅ **Context menus**: Group related actions, max 9 items
- ❌ **Avoid**: 12+ items in dropdown without categories

**Implementation**:

```svelte
<!-- ✅ Good: Categorized navigation -->
<nav>
  <NavGroup title="Core">
    <NavItem>Notes</NavItem>
    <NavItem>Graph</NavItem>
    <NavItem>Search</NavItem>
  </NavGroup>
  <NavGroup title="Settings">
    <NavItem>Preferences</NavItem>
    <NavItem>Plugins</NavItem>
  </NavGroup>
</nav>
```

### Working Memory & Chunking

**Principle**: Group related information into meaningful chunks

**In Bismuth**:

- ✅ **Note metadata**: Group date, tags, links into sections
- ✅ **Settings**: Categorize into Editor, Vault, Appearance, Plugins
- ✅ **Wikilinks**: Show context (folder/title) not just filename

---

## Part 2: Visual Design

### F.2.1.01 - Visual Hierarchy

**Principle**: Size, color, spacing indicate importance

**In Bismuth**:

- ✅ **Note title**: Largest text (2rem), bold
- ✅ **Headings**: Progressive sizing (h1 > h2 > h3)
- ✅ **Metadata**: Smaller, muted color
- ✅ **Active note**: Highlighted background in file tree

**CSS Standards**:

```css
/* Visual hierarchy scale */
.note-title {
  font-size: 2rem;
  font-weight: 700;
}
.heading-1 {
  font-size: 1.75rem;
  font-weight: 600;
}
.heading-2 {
  font-size: 1.5rem;
  font-weight: 600;
}
.body-text {
  font-size: 1rem;
}
.metadata {
  font-size: 0.875rem;
  color: var(--text-muted);
}
```

### Gestalt Laws

**Law of Proximity**: Related items should be close together

```svelte
<!-- ✅ Good: Related controls grouped -->
<div class="editor-controls">
  <button>Bold</button>
  <button>Italic</button>
  <button>Underline</button>
</div>
<div class="spacing-8"></div>
<div class="insert-controls">
  <button>Link</button>
  <button>Image</button>
</div>
```

**Law of Similarity**: Similar items should look similar

- All primary buttons: Same color, size, border-radius
- All wikilinks: Same blue color, underline on hover
- All metadata: Same muted color, same font size

### Whitespace

**Principle**: Breathing room improves comprehension

**In Bismuth**:

- ✅ **Editor padding**: 1-2rem on all sides
- ✅ **Line height**: 1.6 for body text
- ✅ **Section spacing**: 2rem between major sections
- ❌ **Avoid**: Cramped sidebars with <8px padding

---

## Part 3: Interaction Design

### F.3.1.01 - Progressive Disclosure

**Principle**: Show only what's needed now, reveal more on demand

**In Bismuth**:

- ✅ **Settings**: Basic settings visible, advanced in expandable section
- ✅ **Note metadata**: Show tags/links on hover or click
- ✅ **Graph filters**: Start with simple view, add filters via button
- ✅ **File operations**: Show common actions, "More" for rare ones

**Example**:

```svelte
<script>
  let showAdvanced = false;
</script>

<div class="settings">
  <!-- Always visible -->
  <Setting label="Theme" />
  <Setting label="Font Size" />

  <!-- Progressive disclosure -->
  <button on:click={() => (showAdvanced = !showAdvanced)}>
    {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
  </button>

  {#if showAdvanced}
    <Setting label="Custom CSS" />
    <Setting label="Vim Mode" />
    <Setting label="Debug Logging" />
  {/if}
</div>
```

### F.4.1.01 - Fitts's Law

**Principle**: Time to reach target = distance / size

**In Bismuth**:

- ✅ **Primary CTA**: Large (min 44x44px), close to related content
- ✅ **Frequent actions**: Toolbar buttons 40x40px minimum
- ✅ **Clickable area**: Extend beyond visible icon (padding)
- ❌ **Avoid**: Tiny close buttons (< 24x24px)

**CSS**:

```css
/* Fitts's Law compliant buttons */
.primary-button {
  min-width: 120px;
  min-height: 44px;
  padding: 12px 24px;
}

.icon-button {
  min-width: 40px;
  min-height: 40px;
  padding: 8px;
}

/* Extend clickable area */
.wikilink {
  padding: 2px 4px;
  margin: -2px -4px;
}
```

### Error Prevention & Feedback

**Principle**: Prevent errors before they happen, give immediate feedback

**In Bismuth**:

- ✅ **Auto-save**: Prevent data loss, show "Saved at HH:mm:ss"
- ✅ **Delete confirmation**: Modal for destructive actions
- ✅ **Invalid input**: Disable submit until valid
- ✅ **Wikilink validation**: Show broken links in different color

---

## Part 4: Information Architecture

### Recognition vs Recall

**Principle**: Show options, don't make users remember

**In Bismuth**:

- ✅ **Wikilink autocomplete**: Show existing notes as you type
- ✅ **Tag suggestions**: Show used tags, not empty input
- ✅ **Recent files**: Show in dropdown, not "type filename"
- ✅ **Keyboard shortcuts**: Show in tooltips and menus

**Example**:

```svelte
<!-- ✅ Good: Recognition -->
<Autocomplete
  placeholder="Link to note..."
  suggestions={existingNotes}
  on:select={insertWikilink}
/>

<!-- ❌ Bad: Recall -->
<input placeholder="Enter note name..." />
```

### Mental Models

**Principle**: Match user's existing mental model

**In Bismuth**:

- ✅ **File tree**: Like OS file explorer (folders, files, hierarchy)
- ✅ **Markdown**: Standard syntax users already know
- ✅ **Keyboard shortcuts**: Match common apps (Cmd+S save, Cmd+F find)
- ✅ **Graph**: Nodes = notes, edges = links (familiar from mind maps)

---

## Part 5: AI & Emerging Interfaces

### F.5.1.01 - Conversational Flow (Future)

**Principle**: AI interactions should feel natural, not robotic

**Planned for Bismuth**:

- AI-powered search: Natural language queries
- Smart suggestions: "You might want to link this to..."
- Auto-tagging: Suggest tags based on content

### F.5.2.01 - AI Transparency

**Principle**: Show when AI is involved, allow human override

**Requirements**:

- ✅ **Indicate AI**: Label AI-generated suggestions clearly
- ✅ **Confidence**: Show certainty (e.g., "80% match")
- ✅ **Override**: Always allow manual correction
- ✅ **Explain**: "Why this suggestion?" tooltip

---

## Part 6: Human-Centered Design

### Accessibility

**Principle**: Usable by everyone, including assistive technology users

**In Bismuth**:

- ✅ **Keyboard navigation**: All features accessible via keyboard
- ✅ **ARIA labels**: Screen reader support
- ✅ **Contrast**: WCAG AA minimum (4.5:1 for text)
- ✅ **Focus indicators**: Visible focus ring on all interactive elements
- ✅ **Alt text**: For images and icons

**Checklist**:

```typescript
// ✅ Keyboard accessible
<button on:click={action} on:keydown={(e) => e.key === 'Enter' && action()}>

// ✅ ARIA labels
<button aria-label="Delete note">
  <TrashIcon />
</button>

// ✅ Focus visible
button:focus-visible {
  outline: 2px solid var(--interactive-accent);
  outline-offset: 2px;
}
```

### Trust Signals

**Principle**: Build confidence through transparency and reliability

**In Bismuth**:

- ✅ **Auto-save indicator**: "Saved at 2:34 PM" builds trust
- ✅ **Error messages**: Specific, actionable ("File not found: note.md")
- ✅ **Progress indicators**: Show during long operations
- ✅ **Undo/redo**: Safety net for mistakes

---

## Evaluation Workflow

### During Design Phase

1. **Classify interface type**: dashboard, form, modal, navigation, etc.
2. **Select relevant parts**: Always Part 1, then type-specific parts
3. **Check violations**: Scan for cognitive load, hierarchy, feedback issues
4. **Score**: Start at 100, deduct for violations
5. **Prioritize fixes**: Critical first, then warnings

### Severity Levels

| Severity       | When to Use                                  | Deduction  |
| -------------- | -------------------------------------------- | ---------- |
| **Critical**   | Blocks task completion, causes abandonment   | -15 points |
| **Warning**    | Degrades experience, reduces conversion      | -7 points  |
| **Suggestion** | Improvement opportunity, would boost metrics | -3 points  |

### Score Bands

- **85-100**: Excellent - Ship it
- **65-84**: Good - Minor improvements recommended
- **40-64**: Fair - Address warnings before shipping
- **0-39**: Poor - Major redesign needed

---

## Application in Code Review

### PR Checklist

When reviewing UI changes, check:

- [ ] **Cognitive Load**: Max 7-9 items in lists/menus?
- [ ] **Visual Hierarchy**: Clear size/color/spacing differences?
- [ ] **Fitts's Law**: Buttons min 40x40px, primary actions 44x44px?
- [ ] **Progressive Disclosure**: Advanced options hidden by default?
- [ ] **Feedback**: Immediate response to all user actions?
- [ ] **Accessibility**: Keyboard nav + ARIA labels + contrast?
- [ ] **Error Prevention**: Confirmations for destructive actions?

### Example Review Comments

```markdown
**Cognitive Load Violation (Critical)**
This dropdown has 15 options. Per Miller's Law (F.1.1.02), users can only process 7±2 items.

**Remediation**: Group into categories or use search/filter for >9 items.

**Business Impact**: Reduced complexity drives 500% productivity increase.
```

---

## Quick Reference

### Common Violations in PKM Apps

1. **Too many sidebar items** → Group into collapsible sections
2. **Unclear wikilink targets** → Show context (folder/title)
3. **No save feedback** → Add "Saved at HH:mm:ss" indicator
4. **Tiny clickable areas** → Min 40x40px for all interactive elements
5. **No keyboard shortcuts** → Add and show in tooltips
6. **Poor contrast** → Check WCAG AA (4.5:1 minimum)
7. **Overwhelming graph view** → Start simple, add filters progressively

### Principle Codes Quick Lookup

- **F.1.1.02**: Cognitive Load (7±2 items)
- **F.2.2.03**: Hick's Law (choice paralysis)
- **F.2.1.01**: Visual Hierarchy
- **F.3.1.01**: Progressive Disclosure
- **F.4.1.01**: Fitts's Law (target size/distance)
- **F.5.1.01**: Conversational Flow (AI)
- **F.5.2.01**: AI Transparency

---

**Last Updated**: 2026-05-26  
**Source**: uxuiprinciples.com framework (168 principles)  
**Maintainer**: Design Team
