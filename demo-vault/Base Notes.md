## Improvements

- Outgoing links([[wikilink]]): add section for linked vs unlinked mentions and add similar restricitons for displayed content
- Backlinks: add bounds for the backlink content preview that gets shown, and if available take the title as defined in the files properties
- Graphs:
  - Context Menu/Sidebar Panel(preferably sidebar panel):
    - Filters (all toggles):
      - Display tags or not
      - display attachments or not
      - display existing files only or not
      - display orphans or not
    - Groups:
      - new group button
      - textbox appears, query in textbox for what gets colored by the following:
        - path: match
        - file: match
        - tag: search
        - line: search keywords
        - section: search keywords under sections
        - [property]: match property
      - can set color and click an X button to close that group, textbox, color picker circle, and close x are all in the same row/line
    - Display:
      - Arrows(toggle)
      - text fade threshold (slider)
      - node size (slider)
      - line thickness (slider)
    - Forces:
      - center force (slider)
      - repel force(slider)
      - link force (slider)
      - link distance (slider)
    - consider and add other useful forces interesting ones, same for display and filters
- Properties
- create a more compact ui and have them be relatve to eachother, to be scaled such that they make sense
  - ensure text boxes are properly bounded, fonts are correct size, and so on

## Missing

- look through code and find all unmakred and marked todos as well as coming soon markers and do the implementation plan for all.
- bulletpoints do not render, should render all markdown use something like markedjs if it is helpful or codemirror again but ensure all the specific needs we want from our live preview are met
- allow the vault to be deleted in settings and renamed as well
- implement folder and file dragging

## Bugs

- remove vertical tab button: should be a button in the sidebar and should open sidebar panel component there instead of note viewer.
- Note title renders out of frame: panel header title
- scroll doesnt work in note viewer, allow scrolling all the way down and have some space rendered at the bottom as padding / free space
- folders dont seem to get rearranged at root, allow the rearrange to happen as per the filtration (name, modified, so on). All files in vault should be updated.
- the light dark mode toggle should have a third option, auto where it goes along with the light or day time settings of the computer
- features icons are still not aligned in the settings, should be set
- wikilinks are currently unrendered

## General

- add a toggle for the bottom status bar and have it default to toggled off. should contain character count as well
- remove the background for the top tool bar bar buttons, essentially want the buttons to be flush
- have vertical tabs actualluy instead be in a sidebar, adding a button for that and removing the esixitjng button in the tabs list
- use flexible moment js formatting for dates and allow settings to select from / text box inset values and add a note for it
- add warning / error / loading modals for various situations and reuse when applicable but should have things like loading when necessary for panels, note viewport, etc and error states as necessary and so on
- properties should have the key value pairing side by side not one on top of another
- allow for zoom / rescaling of the app in settings
- add the sidebar button for the command pallete above settings as it is a modal
- track if file gets updated in other places and allow it to happen instead of overrwiting when the file gets reopened, even if happening in simultaneous session
