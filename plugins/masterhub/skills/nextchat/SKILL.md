---
name: nextchat
description: Moves the work to a new chat. Writes down where things stand and gives one block of text to paste into the new chat. The user runs this command when a chat has grown long.
argument-hint: "[direction; empty means everything in this chat]"
disable-model-invocation: true
---

The user is moving to a new chat. Prepare a handoff so that the new chat continues without asking "what is this and where is it". Ask nothing, just do it.

Direction: $ARGUMENTS (empty means everything done in this chat; in a project with a hub, this chat's topic).

1. Collect from this chat: what was done (files with paths), what the user approved (their words and the date), their edits and rules, what is unfinished, what waits for the user, the next step. Write only what is confirmed, and mark anything unchecked as unchecked. Copy the user's conditions, bans and decisions word for word with the time: they get lost in a retelling.
2. Write a new file `08_AGENTS/HANDOFF/YYYY-MM-DD_HHMM_<direction>.md` (the main chat uses `masterhub` as the direction). No such folder: use `HANDOFF/` and create it. Existing files are neither overwritten nor deleted. Keep it to about 80 lines; link to files for details. Near the top, in a project with a hub: "Tasks: 08_AGENTS/HUB/<topic>.md" and "Main chat: MasterHub <PROJECT>".
3. Update the project map `00_START_HERE.md`, only the lines of your direction. No map at all: create it.
4. In a project with a hub: set the current status of your items in `08_AGENTS/HUB/<topic>.md`. Send the main chat one line if `SendMessage` is available: "<Topic>: moving to a new chat, handoff <file>".
5. Reply with one code block, the message for the new chat:
   - main chat: `/hub` on the first line, then "Continue from handoff 08_AGENTS/HANDOFF/<file>." and the next step in brief;
   - topic chat: "Chat: <Topic>.", then "Continue from handoff 08_AGENTS/HANDOFF/<file>." and the next step in brief;
   - no hub in the project: "Continue <direction>. Read <map> and <handoff file>." and the next step in brief.

   Under the block write: "Open a new chat and paste this block." Then one line with the files written. The last line says whether this chat may be closed: "🟢 This chat can be closed" if nothing is running and everything is written, otherwise "🟠 Do not close yet: <what is running and when it ends>". Nothing else.
6. After the handoff this chat follows `${CLAUDE_PLUGIN_ROOT}/skills/hub/references/chat-switch.md`, part "Old chat".
