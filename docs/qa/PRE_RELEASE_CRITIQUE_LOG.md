# Nugget pre-release critique log

**Started:** July 18, 2026
**Status:** Walkthrough in progress; critique 1 resolved during the pass at Steven's request

Use this document to retain Steven's observations during the live pre-release walkthrough. Capture the problem and possible directions without selecting or implementing a solution until the walkthrough concludes.

## 1. Saving edits requires too much scrolling

- **Surface:** Initial Edit Idea screen
- **Status:** Resolved on July 18, 2026
- **Observation:** After editing a section, the user must scroll to the bottom of a potentially long idea to reach the save action.
- **Impact:** Adds friction on mobile, interrupts review flow, and can make it unclear whether section edits have been retained.
- **Implemented direction:**
  - Debounced valid edits save automatically to the local idea record without triggering GPT reprocessing.
  - A sticky top status reports waiting, saving, saved, validation, and failure states.
  - A prominent top `Done` action saves any remaining valid edit and exits edit mode.
  - The bottom `Save changes` action remains as a fallback.
  - `Cancel editing` became `Discard unsaved edits` so the control does not imply that already-autosaved changes can be undone.
- **Evidence:** Focused component tests cover automatic persistence and visible status. Manual checks at a 430 x 932 mobile viewport confirmed the sticky bar, a real debounced save, the restored title, and the `Done` transition back to summary view.
