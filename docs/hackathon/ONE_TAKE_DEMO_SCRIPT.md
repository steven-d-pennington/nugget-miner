# Nugget one-take phone demo

This is the operator script for recording the complete phone walkthrough in one
continuous take. It targets **2:45 to 2:55** and keeps a small safety margin
inside the three-minute Build Week limit.

## Prepare before pressing record

- Use the public production app installed on the iPhone home screen.
- Turn on Do Not Disturb, lock portrait orientation, and set text size and
  brightness so every label is legible.
- Start iPhone Screen Recording with the microphone enabled. Do a five-second
  test first to confirm that Screen Recording and Nugget can both hear the mic.
- Open Nugget on **Capture**. Dismiss any update prompt before the take.
- Grant cloud-processing consent and verify transcription and organization
  health in Settings before the take. Never show an API key.
- Prepare one truthful fallback: record and process the safe ramble below once,
  but leave that capture at **Ready for review**. It should appear from the
  **capture ready to review** banner in Ideas.
- Keep this script on a second device or print it. Do not switch away from
  Nugget during the recording.
- Rehearse the taps once. Speak conversationally at about 135 words per minute.

Only trim silence before the first word and after the last word. The walkthrough
itself should remain a continuous recording.

## The one-take script

The quoted text is spoken. Bracketed text is an action and is not spoken.

### 0:00-0:12 — Open on Capture

**Screen:** The Capture tab, with the record control and waveform visible.

> "Good ideas show up while I am moving, and they usually disappear inside a
> long voice note. Nugget is built around one simple flow: capture first,
> organize later."

**Action:** Tap **Record**. Pause for half a second, then read the ramble.

### 0:12-0:45 — Record a real two-idea ramble

> "I want to start a neighborhood tool-sharing library so nearby households can
> borrow rarely used tools instead of buying duplicates. The blocker is tracking
> availability and responsibility, and I need to research lightweight inventory
> and lending tools. Separately, at work, I want an automated weekly support
> handoff that carries unresolved tickets, customer impact, owners, and next
> steps into Monday standup. Before I build it, I need to map which system owns
> the handoff fields."

**Action:** Let the waveform react while you speak. Pause for half a second,
then tap **Stop & save**.

### 0:45-1:03 — Show local save and begin processing

**Screen:** Hold on **Recording saved** long enough for the local-save message
and source audio to be readable.

> "Before any AI processing begins, Nugget saves the recording in this browser.
> I can leave now without losing it. When I choose processing, audio is sent for
> transcription and the transcript is sent to GPT-5.6 Terra for grounded
> organization."

**Action:** Tap **Process now**. If the consent dialog appears, tap its allow or
continue button. Hold briefly on the Saved, Transcribing, Organizing, and Ready
for review timeline.

### 1:03-1:36 — Review before accepting

If the live result is ready, open it and say:

> "This one ramble became separate, editable ideas. Before anything enters my
> library, I can correct the title, summary, category, tags, goals, blockers,
> research needs, and next actions. The grounding labels distinguish what was
> explicit, inferred, or suggested."

**Action:** Scroll slowly enough to show the first idea's title, category, tags,
summary, blocker, research need, and action. Tap **Next idea**, show the second
idea, then tap **Confirm all ready ideas**.

If processing is not ready after roughly eight seconds, use the fallback under
"Live-processing branches" below. Do not wait silently.

### 1:36-2:00 — Retrieve ideas in two useful views

**Action:** Tap **Ideas**. Keep the card layout visible, then tap **Compact** and
return to **Cards**. If time permits, filter once by **Personal** or **Work**.

> "Confirmed ideas stay local and searchable. I can filter by category or tag,
> and switch between a visual card feed and a compact scanning view."

**Action:** Open **Create a neighborhood tool-sharing library**, or the actual
personal idea title produced by the live result.

### 2:00-2:22 — Show the useful organized result

**Action:** Begin at the summary and make one deliberate downward scroll through
the goal, blocker, research need, suggested resources or actions, and source.

> "Each idea keeps the useful structure together: why it matters, what is in the
> way, what needs research, useful next steps, and the original source. Everything
> remains editable."

### 2:22-2:37 — Turn an idea into action

**Action:** Tap **Actions**. Check one incomplete action while its source idea is
visible. If every action is already complete, briefly toggle one off and on.

> "Accepted next steps collect in Actions without losing the idea they came
> from. That is how a ramble becomes something I can actually use."

### 2:37-2:51 — Make the privacy boundary visible

**Action:** Tap the Settings gear. Scroll directly to **About** and the provider
health rows.

> "Nugget keeps saved recordings and ideas in this browser. Settings makes the
> cloud-processing boundary visible and shows live transcription and GPT-5.6
> Terra health."

Do not read model names from memory. If the health rows differ, say only what is
actually visible.

### 2:51-2:57 — Close cleanly

**Action:** Tap **Capture** and hold on the record control.

> "Nugget turns a ramble into ideas I can actually use."

Stop Screen Recording immediately after a one-second hold.

## Live-processing branches

Use at most one of these. The fallback is part of the continuous take; it does
not pretend that a pending or failed request succeeded.

### Processing is still running

> "This capture is still processing, so for the rest of this one-take tour I am
> opening a preprocessed version of the same safe demo."

Tap **Ideas**, open the **capture ready to review** banner, and resume at the
review section. If the banner shows a count, say nothing about the count.

### Processing shows an error

> "The recording and transcript are still safe in this browser, and processing
> can be retried. I will continue with a preprocessed version of the same safe
> demo."

Tap **Ideas**, open the ready-to-review banner, and resume at review.

### Only the clearly labeled sample library is available

> "For the remaining interface tour, I am using Nugget's clearly labeled local
> sample library. It does not call GPT-5.6 and it is not the live result."

Keep every **Sample** label visible. Never describe sample data as the output of
the capture just recorded.

## Clean teleprompter copy

Good ideas show up while I am moving, and they usually disappear inside a long
voice note. Nugget is built around one simple flow: capture first, organize
later.

I want to start a neighborhood tool-sharing library so nearby households can
borrow rarely used tools instead of buying duplicates. The blocker is tracking
availability and responsibility, and I need to research lightweight inventory
and lending tools. Separately, at work, I want an automated weekly support
handoff that carries unresolved tickets, customer impact, owners, and next steps
into Monday standup. Before I build it, I need to map which system owns the
handoff fields.

Before any AI processing begins, Nugget saves the recording in this browser. I
can leave now without losing it. When I choose processing, audio is sent for
transcription and the transcript is sent to GPT-5.6 Terra for grounded
organization.

This one ramble became separate, editable ideas. Before anything enters my
library, I can correct the title, summary, category, tags, goals, blockers,
research needs, and next actions. The grounding labels distinguish what was
explicit, inferred, or suggested.

Confirmed ideas stay local and searchable. I can filter by category or tag, and
switch between a visual card feed and a compact scanning view.

Each idea keeps the useful structure together: why it matters, what is in the
way, what needs research, useful next steps, and the original source. Everything
remains editable.

Accepted next steps collect in Actions without losing the idea they came from.
That is how a ramble becomes something I can actually use.

Nugget keeps saved recordings and ideas in this browser. Settings makes the
cloud-processing boundary visible and shows live transcription and GPT-5.6
Terra health.

Nugget turns a ramble into ideas I can actually use.

## Final take checks

- Duration is **2:59 or less** after trimming only the ends.
- The waveform visibly responds to the spoken ramble.
- The recording-save state is visible before cloud processing begins.
- Any fallback is disclosed in the take itself.
- Sample labels, if used, remain visible.
- No API key, private notification, task content, or personal recording appears.
- The video shows Capture, processing, review, Ideas, Compact view, idea detail,
  Actions, Settings health, and the return to Capture.
