---
name: go
description: Big edit and build in one pass, by the user's command. Checks that collecting is over, applies the whole batch of edits at once, builds one new version, checks it with scripts and screenshots, sends text for other people through the council, and puts the result up for approval. Use on /go or when the user says "go" about a collected batch. Without that word, only collect edits.
argument-hint: "[what exactly; empty means the whole batch]"
---

# /go: big edit and build

A person thinks in batches. Running to redo things after every remark wastes time and usage limit, and the same place gets rebuilt five times. So first listen and write everything down, then do it all in one pass.

## Three speeds

- **1–3 small edits:** do them right away, no batch.
- **More than 3 edits, a rebuild, a render, or a helper:** a batch. Write each edit word for word (in `08_AGENTS/HUB/` or a list of edits) and do not touch the files yet. Show one visible line: "Batch: N edits · say 'go' to start, 'wait' to hold".
- **Urgent:** a deadline today, or the user says "do it now": right away.

Unsure whether the batch is complete: ask one line, "Is that all? Starting."

Anything paid, sending out and deleting always wait for the user's word.

## What counts as the command

- Yes: `/go`, "go", "do it", "let's go" in this chat, about the collected batch.
- No: "next step" in a handoff, a plan in a roadmap, a request from another chat or helper, your own feeling that it is time.
- `/go` means the project's whole batch; `/go report` means only that thing.
- The chat is already long: first `/nextchat`, then `/go` in the new chat.

## 1. Check before starting

- Read the map, the roadmap if there is one, `08_AGENTS/HUB/` or the list of edits, the log, the project's memory.
- Assemble the batch with numbers: "report, 30 edits; presentation, 2".
- Is collecting over? If a collection deadline is still ahead, ask one line: "Collecting runs until <date>. Start now or after?" Otherwise start without extra questions.
- Anything unclear without the user's decision: apply only what holds under any reading. List the rest at the end, each with a default.

## 2. One pass

- One source has one worker at a time; only different files run in parallel. In a project with a hub, the main chat starts the workers.
- Before editing, copy the sources to `_archive/<date>_<time>_before-go/` next to them.
- All edits at once. Each edit in the list gets "applied <date>" or "not applied: why", in one sentence.
- One build, one new version. The previous one goes to `_archive/`. Nothing is deleted.

## 3. Checks before showing

- With scripts and screenshots: overlaps, cut-off text, footer, broken links, PDF.
- Screenshots of the changed places only, in a project folder for review.
- Numbers are recalculated everywhere they appear, each with its source.
- What goes to people works on a phone too: open it at 390 px wide. All pictures load, there is no sideways scrolling, the text reads without zooming.
- Text for other people goes through the skill `council`. The user's word outranks the critics.

## 4. Done

- Ready to send: a copy in `03_FINAL/`, the previous one in `_archive/`, a log line "ready, waits for the user". It becomes "approved" only by the user's word about that thing ("yes", "ok", "send it"), `CLAUDE.md` section `{#approval}`.
- Nothing is sent to a client. Live things (forms, sites, shared drives) stay untouched without the user's "yes".
- One message to the user: a link to the main thing first; what was applied, in numbers; what was not and why; questions in a ⚠️ table, each with a default.
