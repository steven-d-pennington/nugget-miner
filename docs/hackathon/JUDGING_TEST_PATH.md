# Judge Test Path

## Fast exploration (about 2 minutes)

1. Open the deployed HTTPS URL.
2. In Settings, select **Load sample library**.
3. Open Ideas and search `community`.
4. Filter Personal and open **Create a neighborhood tool-sharing library**.
5. Inspect the goal, blocker, research need, suggested action, and **Sample transcript—no recording** source drawer.
6. Open Actions, complete **Draft a one-page interest survey.**, and return to the idea.
7. Export the idea as Markdown.

The sample library is local, clearly labeled **Sample**, and does not call GPT-5.6. It is a fast exploration path, not evidence of live capture or cloud processing.

## Live GPT-5.6 path

1. Return to Capture and record or paste a ramble containing at least two different ideas.
2. For audio, select **Stop & save**. For pasted text, select **Save ramble**.
3. Select **Process now** and enable cloud processing when prompted.
4. Wait for transcription, separation, and organization.
5. Review the separate ideas, edit category or tags as needed, and confirm them.
6. Find the confirmed ideas in the library.

Live processing sends the recording for transcription and its transcript for GPT-5.6 organization only after the user enables or initiates cloud processing. Saved captures and ideas remain in the browser; Nugget has no cloud sync.

## Public production rehearsal — July 17, 2026

Sol executed the complete fast-exploration path against
<https://nugget-miner-kappa.vercel.app> in a clean 430 x 932 mobile Chrome
context. The root returned HTTP 200. **Load sample library** navigated to Ideas;
searching `community` and selecting Personal produced exactly **Create a
neighborhood tool-sharing library**. The editable detail exposed Goals,
Blockers, Research needed, Suggested actions, and the expanded **Sample
transcript—no recording** source. **Draft a one-page interest survey.** moved
to Completed, its idea link returned to the correct detail, and **Export
Markdown** downloaded `create-a-neighborhood-tool-sharing-library.md`.

The exported Markdown contained the expected title, Personal category,
`community` tag, and completed action, while omitting the source transcript.
The final gate exited 0 with zero console errors, page errors, HTTP responses
at or above 400, or unexpected failed requests. Two initial harness assertions
were corrected without application changes: the editable detail title is an
accessible Title textbox rather than an `h1`, and the source drawer locator was
made independent of PowerShell em-dash encoding. A third harness run showed
Playwright `check()` waiting on the old checkbox accessible name after the app
had already changed it to the correct completed-state name; the final gate used
a normal click and explicitly awaited that completed-state control.

A separate clean-context idempotency check selected **Load sample library**
twice. The Ideas list contained exactly three items after the first load and
exactly three after the second, with zero console errors.

This rehearsal used only local sample data and made no GPT or transcription
provider call. The live GPT-5.6 path above remains the truthful demonstration
path for the video.
