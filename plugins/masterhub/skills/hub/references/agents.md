# Helper agents

Read this before running a helper. The user writes only to the main chat; helpers do the topic work in the background.

## Who runs what

- The main chat runs helpers of type `masterhub:helper`. That agent has no tool for starting other agents.
- **Helpers never start helpers.** The main chat would not see them, and the usage limit would go on work nobody controls. The mod `no-nested-agents` refuses such calls. If that type is not offered in this chat, use a general helper and add "do not start your own agents" to the task.
- A task splits into independent parts: the main chat starts the parallel helpers itself. One source file has one helper at a time.
- One thing, one helper, start to finish. Follow-up edits go to the same helper (`SendMessage` with its id): it remembers the files. A new helper only for a fresh look or a parallel part.

## Model and effort

Choose by difficulty before you start, not by the kind of task.

| Work | Model | Effort |
|---|---|---|
| Mechanical: building, moving files, edits from a ready list | sonnet | medium |
| Page behaviour, bugs with an unclear cause, anything the user has already sent back | opus | high |
| New text for other people | opus | high |
| Not sure | opus | high |

## The task you give

Short: the user's words verbatim (they are in `08_AGENTS/HUB/<topic>.md`), which item, the first step. Project rules are already in `CLAUDE.md`, so do not repeat them. Add these lines where they apply:

- something visible is being made: a PNG at every stage in `02_WORK/<topic>/_work/review/`, plus one line "what is done + path to PNG";
- text for other people: "before writing, read `${CLAUDE_PLUGIN_ROOT}/skills/hub/references/plain-language.md`";
- heavy work (render, video encoding, batch processing): one process at a time, at low priority, and leave the computer usable.

A new thing where look or behaviour matters starts with the skill `ready`: the helper gets the finished "Done" card. Text for other people goes through the skill `council`.

## While helpers work

- Report at the important moments: who is doing what (helper, model, task), what came back, what passed its checks, who is stuck.
- Something visible: give the user 2–4 links to fresh PNG files right away, with one line on what they show. A stage without PNG does not count as done.
- A status is written only after the result is checked. "Deleted", "sent" or "done" go into a file after you have seen it happen.
- Keep this chat open while a helper runs. List running helpers in your handoff.

## Blind acceptance

For important work, a second helper sees only the user's words and the result. It answers item by item: matches, does not match, why. It does not fix anything.
