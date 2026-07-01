# Bismuth PICT Test Suites

Comprehensive pairwise test coverage for all major Bismuth subsystems.

---

## Suite 1: App View Routing & Layout

Tests the main viewport switching logic between notes, graph, calendar, and canvas views based on user interactions.

### PICT Model

```
# Parameters
CurrentView: notes, graph, calendar, canvas
LeftTabAction: files, search, graph, tags, entities, tasks, none
RightTabAction: backlinks, calendar, outline, properties, git, none
VaultState: open, closed, loading
FeatureCalendarEnabled: true, false
FeatureGraphEnabled: true, false
FeatureCanvasEnabled: true, false

# Constraints
IF [VaultState] = "closed" THEN [CurrentView] = "notes";
IF [VaultState] = "loading" THEN [CurrentView] = "notes";
IF [FeatureCalendarEnabled] = "false" THEN [RightTabAction] <> "calendar";
IF [FeatureGraphEnabled] = "false" THEN [LeftTabAction] <> "graph";
IF [CurrentView] = "canvas" AND [FeatureCanvasEnabled] = "false" THEN [CurrentView] = "notes";
IF [LeftTabAction] = "graph" THEN [CurrentView] = "graph";
IF [RightTabAction] = "calendar" THEN [CurrentView] = "calendar";
```

### Generated Test Cases

| Test # | CurrentView | LeftTabAction | RightTabAction | VaultState | CalendarEnabled | GraphEnabled | CanvasEnabled | Expected Result |
|--------|-------------|---------------|----------------|------------|-----------------|--------------|---------------|-----------------|
| 1 | notes | files | backlinks | open | true | true | true | Notes view, left=files, right=backlinks |
| 2 | notes | search | outline | open | false | true | false | Notes view with outline panel |
| 3 | graph | graph | properties | open | true | true | true | Graph in viewport, left=graph active |
| 4 | notes | tags | calendar | open | true | false | true | Calendar in viewport, right=calendar |
| 5 | canvas | none | none | open | true | true | true | Canvas fullscreen view |
| 6 | notes | entities | git | open | true | true | false | Notes view, git panel right |
| 7 | notes | tasks | backlinks | open | false | false | true | Notes view, tasks panel left |
| 8 | notes | none | none | closed | true | true | true | WelcomeScreen rendered |
| 9 | notes | none | none | loading | false | true | false | Loading spinner shown |
| 10 | graph | graph | outline | open | false | true | true | Graph view with outline panel |
| 11 | notes | files | properties | open | true | false | false | Notes view, minimal sidebar |
| 12 | notes | search | calendar | open | true | true | false | Calendar in viewport |
| 13 | notes | none | none | open | false | false | false | Minimal notes-only view |
| 14 | canvas | files | none | open | true | false | true | Canvas fullscreen (ignores tabs) |
| 15 | notes | tags | git | open | true | true | true | Notes view with git |

---

## Suite 2: Feature Flag System

Tests the feature toggle store operations — toggle, setFlag, reset, persistence, and tab visibility.

### PICT Model

```
# Parameters
Operation: toggle, setFlag, reset, load
FeatureKey: fileTree, search, graphView, calendar, tasksPanel, canvas, backlinks
InitialState: enabled, disabled
StorageState: empty, validJSON, corruptedJSON
UserAction: toggleOn, toggleOff, resetAll

# Constraints
IF [Operation] = "reset" THEN [UserAction] = "resetAll";
IF [Operation] = "load" THEN [UserAction] = "toggleOn";
IF [InitialState] = "enabled" AND [UserAction] = "toggleOn" THEN [Operation] <> "toggle";
IF [InitialState] = "disabled" AND [UserAction] = "toggleOff" THEN [Operation] <> "toggle";
IF [StorageState] = "corruptedJSON" THEN [Operation] = "load";
```

### Generated Test Cases

| Test # | Operation | FeatureKey | InitialState | StorageState | UserAction | Expected Result |
|--------|-----------|------------|--------------|--------------|------------|-----------------|
| 1 | toggle | calendar | disabled | validJSON | toggleOn | calendar becomes true, persisted |
| 2 | toggle | graphView | enabled | validJSON | toggleOff | graphView becomes false, tab hidden |
| 3 | setFlag | fileTree | disabled | validJSON | toggleOn | fileTree set to true explicitly |
| 4 | setFlag | canvas | enabled | validJSON | toggleOff | canvas set to false |
| 5 | reset | tasksPanel | enabled | validJSON | resetAll | All flags reset to DEFAULT_FEATURE_FLAGS |
| 6 | load | backlinks | disabled | empty | toggleOn | Returns DEFAULT_FEATURE_FLAGS (backlinks=false) |
| 7 | load | search | enabled | corruptedJSON | toggleOn | Falls back to defaults, search=true |
| 8 | load | calendar | disabled | validJSON | toggleOn | Merges saved flags with defaults |
| 9 | toggle | tasksPanel | disabled | empty | toggleOn | tasksPanel true, new storage entry created |
| 10 | setFlag | graphView | disabled | empty | toggleOn | graphView true, persisted |
| 11 | reset | fileTree | disabled | empty | resetAll | localStorage cleared, defaults restored |
| 12 | toggle | backlinks | enabled | validJSON | toggleOff | backlinks false, sidebar tab hidden |

---

## Suite 3: Calendar Event Creation

Tests the event creation flow through the EventDialog including different event types, timing, and validation.

### PICT Model

```
# Parameters
EventType: event, task, time-block
Title: valid, empty, whitespaceOnly
AllDay: true, false
Date: today, future, past
StartHour: 0, 9, 12, 17, 23
DurationHours: 0, 1, 2, 4
DurationMinutes: 0, 15, 30, 45
ExistingEvents: none, few, many

# Constraints
IF [AllDay] = "true" THEN [StartHour] = "9";
IF [AllDay] = "true" THEN [DurationHours] = "0";
IF [AllDay] = "true" THEN [DurationMinutes] = "0";
IF [Title] = "empty" THEN [EventType] = "event";
IF [Title] = "whitespaceOnly" THEN [EventType] = "event";
IF [DurationHours] = "0" AND [DurationMinutes] = "0" AND [AllDay] = "false" THEN [DurationHours] = "1";
```

### Generated Test Cases

| Test # | EventType | Title | AllDay | Date | StartHour | DurH | DurM | Events | Expected Result |
|--------|-----------|-------|--------|------|-----------|------|------|--------|-----------------|
| 1 | event | valid | false | today | 9 | 1 | 0 | none | Event created, shown in week view |
| 2 | task | valid | false | future | 12 | 2 | 30 | few | Task event with checkbox at 12pm |
| 3 | time-block | valid | false | today | 17 | 4 | 0 | many | Time block rendered 5pm-9pm |
| 4 | event | empty | false | past | 0 | 1 | 15 | none | Submit disabled, no event created |
| 5 | event | valid | true | today | 9 | 0 | 0 | few | All-day event in all-day row |
| 6 | task | valid | true | future | 9 | 0 | 0 | none | All-day task with checkbox |
| 7 | time-block | valid | false | past | 23 | 1 | 45 | few | Time block at 11pm |
| 8 | event | whitespaceOnly | false | today | 12 | 2 | 0 | many | Submit disabled (whitespace-only) |
| 9 | event | valid | false | future | 0 | 1 | 0 | none | Midnight event created |
| 10 | task | valid | false | today | 9 | 1 | 30 | many | Task at 9am, 1.5h duration |
| 11 | time-block | valid | true | today | 9 | 0 | 0 | none | All-day time block |
| 12 | event | valid | false | past | 17 | 4 | 45 | few | Past event created normally |

---

## Suite 4: Calendar View Navigation

Tests the calendar navigation logic (prev/next, view switching, today button) across all view modes.

### PICT Model

```
# Parameters
ViewMode: week, month, year
NavigationAction: prev, next, today, switchView
TargetView: week, month, year
FocusDate: startOfYear, midYear, endOfYear, today
HasEvents: true, false

# Constraints
IF [NavigationAction] <> "switchView" THEN [TargetView] = "week";
IF [NavigationAction] = "today" THEN [FocusDate] = "today";
```

### Generated Test Cases

| Test # | ViewMode | NavAction | TargetView | FocusDate | HasEvents | Expected Result |
|--------|----------|-----------|------------|-----------|-----------|-----------------|
| 1 | week | prev | week | midYear | true | Focus date -= 7 days, events shown |
| 2 | week | next | week | today | true | Focus date += 7 days |
| 3 | month | prev | week | endOfYear | false | Focus month -= 1 |
| 4 | month | next | week | startOfYear | true | Focus month += 1 |
| 5 | year | prev | week | midYear | false | Focus year -= 1 |
| 6 | year | next | week | today | false | Focus year += 1 |
| 7 | week | today | week | today | true | Focus snaps to current date |
| 8 | month | today | week | today | false | Focus snaps to today's month |
| 9 | week | switchView | month | midYear | true | Switches to month view |
| 10 | month | switchView | year | startOfYear | true | Switches to year view |
| 11 | year | switchView | week | endOfYear | false | Switches to week view |
| 12 | year | switchView | month | today | true | Year → month transition |

---

## Suite 5: Welcome Screen Flow

Tests the vault creation/opening workflow from the welcome screen landing page.

### PICT Model

```
# Parameters
View: landing, home, template
Action: start, createBlank, createTemplate, openExisting, back
FolderSelection: selected, cancelled
VaultNameInput: valid, empty, tooLong
Template: blank, zettelkasten, gtd, academic
IsCreating: true, false

# Constraints
IF [View] = "landing" THEN [Action] = "start";
IF [View] = "home" AND [Action] = "back" THEN [View] = "template";
IF [Action] = "start" THEN [FolderSelection] = "selected";
IF [Action] = "start" THEN [VaultNameInput] = "valid";
IF [Action] = "createTemplate" THEN [View] = "home";
IF [FolderSelection] = "cancelled" THEN [VaultNameInput] = "valid";
IF [IsCreating] = "true" THEN [Action] <> "start";
IF [Template] <> "blank" THEN [Action] = "createTemplate";
```

### Generated Test Cases

| Test # | View | Action | FolderSelection | VaultName | Template | IsCreating | Expected Result |
|--------|------|--------|-----------------|-----------|----------|------------|-----------------|
| 1 | landing | start | selected | valid | blank | false | Transitions to home view |
| 2 | home | createBlank | selected | valid | blank | false | Folder picker opens, name dialog shown |
| 3 | home | createBlank | cancelled | valid | blank | false | No action, stays on home |
| 4 | home | createTemplate | selected | valid | zettelkasten | false | Template vault created |
| 5 | home | createTemplate | selected | empty | gtd | false | Name dialog blocks submit |
| 6 | home | openExisting | selected | valid | blank | false | Vault opens, main app loads |
| 7 | home | openExisting | cancelled | valid | blank | false | Stays on home view |
| 8 | template | back | selected | valid | blank | false | Returns to home view |
| 9 | home | createTemplate | selected | valid | academic | false | Academic template vault created |
| 10 | home | createBlank | selected | tooLong | blank | false | Validation warning on name |
| 11 | home | createTemplate | selected | valid | gtd | true | Buttons disabled during creation |
| 12 | home | openExisting | selected | valid | blank | true | Loading state, buttons disabled |

---

## Suite 6: Task Integration with Calendar

Tests how tasks with due dates render on the calendar and how completion toggling works.

### PICT Model

```
# Parameters
TaskStatus: open, done, cancelled
TaskPriority: none, low, medium, high, critical
HasDueDate: true, false
DueDateRelation: past, today, future
CalendarView: week, month, year
ToggleAction: toggleComplete, noAction

# Constraints
IF [HasDueDate] = "false" THEN [DueDateRelation] = "today";
IF [TaskStatus] = "cancelled" THEN [ToggleAction] = "noAction";
IF [CalendarView] = "year" THEN [ToggleAction] = "noAction";
```

### Generated Test Cases

| Test # | Status | Priority | HasDueDate | DueRelation | CalView | Toggle | Expected Result |
|--------|--------|----------|------------|-------------|---------|--------|-----------------|
| 1 | open | high | true | today | week | toggleComplete | Task shown orange, becomes done on click |
| 2 | open | critical | true | past | month | noAction | Task shown red in past date cell |
| 3 | done | none | true | future | week | toggleComplete | Strikethrough task, unmarks on click |
| 4 | open | medium | true | today | month | toggleComplete | Task in today's cell, gets checked |
| 5 | open | low | true | future | week | noAction | Task shown on future day column |
| 6 | done | high | true | past | year | noAction | Day dot indicator shown |
| 7 | cancelled | critical | true | today | week | noAction | Task not togglable |
| 8 | open | none | false | today | week | noAction | Task NOT shown on calendar (no due date) |
| 9 | open | high | true | future | year | noAction | Event dot on future date in mini-month |
| 10 | done | low | true | today | month | noAction | Strikethrough in today cell |
| 11 | open | medium | true | past | week | toggleComplete | Overdue task checked |
| 12 | open | none | true | today | week | toggleComplete | Task at today, completed |

---

## Suite 7: Sidebar Tab Visibility & Feature Flags

Tests that sidebar tabs correctly show/hide based on feature flag state and that unknown tabs always show.

### PICT Model

```
# Parameters
SidebarPosition: left, right
TabId: files, search, graph, calendar, tasks, git, outline, backlinks, unknown-tab
FeatureEnabled: true, false
TabSection: upper, lower
UserAction: click, reorder, moveSection

# Constraints
IF [TabId] = "unknown-tab" THEN [FeatureEnabled] = "true";
IF [SidebarPosition] = "left" THEN [TabId] IN {files, search, graph, tasks, unknown-tab};
IF [SidebarPosition] = "right" THEN [TabId] IN {calendar, git, outline, backlinks, unknown-tab};
IF [UserAction] = "moveSection" THEN [TabSection] = "upper";
```

### Generated Test Cases

| Test # | Position | TabId | Enabled | Section | Action | Expected Result |
|--------|----------|-------|---------|---------|--------|-----------------|
| 1 | left | files | true | upper | click | Files tab visible and activatable |
| 2 | left | graph | false | upper | click | Graph tab hidden from sidebar |
| 3 | left | search | true | lower | reorder | Search visible, reorderable |
| 4 | left | tasks | false | upper | click | Tasks tab hidden |
| 5 | right | calendar | true | upper | click | Calendar tab visible, opens calendar view |
| 6 | right | calendar | false | upper | click | Calendar tab hidden |
| 7 | right | git | true | lower | reorder | Git panel visible |
| 8 | right | outline | true | upper | moveSection | Outline moved to upper section |
| 9 | right | backlinks | false | upper | click | Backlinks tab hidden |
| 10 | left | unknown-tab | true | upper | click | Unknown tab always visible |
| 11 | right | unknown-tab | true | lower | reorder | Unknown tab visible, reorderable |
| 12 | left | files | true | upper | moveSection | Files stays in upper (pinned) |

---

## Suite 8: Icon Rendering System

Tests that all icon references resolve to valid SVG paths and render correctly.

### PICT Model

```
# Parameters
IconContext: sidebar, settings, toolbar, calendar, featureToggle
IconName: folder, search, clock, calendar, git-branch, toggle-left, droplet, hard-drive, sparkles, unknown-icon
Size: 12, 16, 20, 28
Color: currentColor, custom

# Constraints
IF [IconContext] = "sidebar" THEN [Size] IN {16, 20};
IF [IconContext] = "settings" THEN [Size] = "16";
IF [IconContext] = "toolbar" THEN [Size] IN {16, 20};
IF [IconContext] = "featureToggle" THEN [Size] = "16";
IF [IconName] = "unknown-icon" THEN [IconContext] = "sidebar";
```

### Generated Test Cases

| Test # | Context | IconName | Size | Color | Expected Result |
|--------|---------|----------|------|-------|-----------------|
| 1 | sidebar | folder | 20 | currentColor | Renders folder SVG path |
| 2 | sidebar | clock | 16 | currentColor | Renders clock (recently added) |
| 3 | settings | toggle-left | 16 | currentColor | Renders toggle icon in Features tab |
| 4 | settings | droplet | 16 | currentColor | Renders droplet in Style tab |
| 5 | toolbar | calendar | 16 | currentColor | Renders calendar icon |
| 6 | featureToggle | sparkles | 16 | currentColor | Renders sparkles for Connections |
| 7 | sidebar | hard-drive | 16 | currentColor | Renders in status bar |
| 8 | calendar | search | 20 | custom | Renders with custom color |
| 9 | sidebar | git-branch | 16 | currentColor | Renders git branch icon |
| 10 | sidebar | unknown-icon | 20 | currentColor | Empty path, no crash (graceful fallback) |
| 11 | toolbar | folder | 20 | currentColor | Renders folder in toolbar |
| 12 | calendar | clock | 16 | custom | Clock icon in calendar |

---

## Test Case Summary

| Suite | Focus Area | Test Cases | Coverage |
|-------|-----------|------------|----------|
| 1 | App View Routing & Layout | 15 | All view transitions + vault states |
| 2 | Feature Flag System | 12 | Toggle/set/reset/load + persistence |
| 3 | Calendar Event Creation | 12 | All event types + validation |
| 4 | Calendar View Navigation | 12 | All views + nav actions |
| 5 | Welcome Screen Flow | 12 | Full onboarding workflow |
| 6 | Task–Calendar Integration | 12 | Task rendering + completion |
| 7 | Sidebar Tab Visibility | 12 | Feature flags → tab visibility |
| 8 | Icon Rendering System | 12 | All icon contexts + fallbacks |
| **Total** | | **99** | Pairwise (all 2-way combinations) |

### Key Constraints Applied

- **Feature flags gate UI**: Disabled features must hide their sidebar tabs
- **View routing is exclusive**: Only one main view active at a time
- **Calendar requires flag**: Calendar tab/view gated by `calendar` feature flag
- **All-day events have no time**: startMinute/duration must be null
- **Empty titles block submit**: Event creation validates non-empty title
- **Unknown tabs always show**: `isTabEnabled` defaults to `true` for unmapped IDs
- **Cancelled tasks can't toggle**: No completion toggle on cancelled status
