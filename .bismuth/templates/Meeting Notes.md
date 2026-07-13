---
date: '{{date.today}}'
time: '{{date.time24}}'
type: meeting
status: active
tags:
  - meeting
---

# Meeting: {{cursor}}

**Date:** {{date.weekday}}, {{date.today}}
**Time:** {{date.time24}}
**Attendees:**

-

## Agenda

1.
2.
3.

## Discussion

### Topic 1

### Topic 2

### Topic 3

## Decisions

| Decision | Owner | Deadline |
| -------- | ----- | -------- |
|          |       |          |

## Action Items

- [ ] **[Owner]:** Action — Due: {{date.today+7}}
- [ ] **[Owner]:** Action — Due: {{date.today+14}}

## Follow-up

- **Next meeting:** {{date.today+7}}
- **Review date:** {{date.today+30}}

---

_Filed in: {{file.folder}}_
_Note ID: {{system.uuid}}_
