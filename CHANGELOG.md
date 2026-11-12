# Changelog

What changed in each version. The newest is first.

## 1.4.1

- `blocks`: the path of a file is gray in a question's file frame too, as everywhere else; a click copies it, only **Open** is blue. VS Code draws a button without `dimColor` filled with the theme's button color, so the path in a frame looked like a blue button. A test checks both places.
- `blocks` on Mac: **File…** opens the system window for choosing files (`pick.applescript`), **Paste screenshot** takes a screenshot or a file copied in Finder (`paste.applescript`). Tests check the commands; a real Mac has not run them yet.
- Install texts: all eight commands in the check, a newer Claude Code found inside VS Code on Windows too, an update from any earlier version.

## 1.4.0

- `blocks`: an answer field under each numbered question of the red "Your answer needed" table, with **Paste screenshot** and **File…** (Windows), a green saved answer with ✅ and **Edit**, **Copy question**, and one **Send answers** button for all. **To the input box** puts the answers into the input box instead. After sending, the questions turn gray.
- `blocks`: each question with its sub-items, file and field sits in its own frame, the number first.
- `blocks`: new badges ☢️ (a yes-or-no question about deleting, a paid run, sending out, a new access) and 🎙 (an interview question).
- `blocks`: a code window has **Copy** at the top right with "✓ copied"; a window longer than 15 lines is folded to 12 with **Show all**. A slash command in a code window is no longer taken for a folder.
- `blocks`: two new scripts, `paste.ps1` and `pick.ps1`. They give the mod only file paths.
- The hub's badge guide names ☢️, 🎙 and the answer field.
- Left out on purpose: closing questions through a question tracker, and a separate answer window. Both need tools that are not part of the set.

## 1.3.0

- Three new commands: `/interview` (a "who am I" interview, answers saved in `about-me/`), `/graphic-design` (order of work and layout rules in numbers) and `/motion` (short motion videos in code, with four reference files).
- The line "Do not close yet" of `/nextchat` and `chat-switch.md` uses an orange badge instead of a red one.
- No automatic move to a new chat: `/nextchat` stays a command that the user runs.
- `blocks` stayed as in 1.2.0.

## 1.2.0

From the first test on a Mac.

- Sections of the project rules and the map have fixed names: each heading carries its English name, its Russian name and a tag like `{#safety}`. Start messages and skills point to sections by them, so a topic chat finds its section after the rules are translated.
- Setup copies the template in one step with a script, `copy_template.ps1` on Windows and `copy_template.sh` on Mac. The script never deletes and never overwrites: a file that exists is kept.
- Setup asks whether the working files live in a folder outside the project and writes it in the map, section "Sources outside the project" `{#sources}`.
- Setup reads the user's own `CLAUDE.md` files in the folders above the project and the personal one. The user's rules hold; the template adapts to them, for example to the user's own rule about deleting.
- Setup first shows what the hub is in three lines: what it is, what changes in the work, one main chat per project. The last message says what it means for the work, not only which folders appeared.
- Approval is in words: "yes", "ok", "send it" about the finished thing. The `/approve` command is removed. If you used it, just say "yes" about the thing instead.
- README and the guide say that the full name of the command is `/masterhub:hub`, and what `/рги` means: the keyboard was on the Russian layout.

## 1.1.0

- `blocks`: a file right inside a question. A row in the red "Your answer needed" table that starts with a file badge and a link becomes a violet frame with Open buttons, so the file is next to its question.

## 1.0.0

The first public version.

- Commands: `/hub`, `/nextchat`, `/approve`, `/go`, `/ready`, `/council`.
- Mods: `blocks` (colored badges), `chat-topic` (the topic under the input box), `no-nested-agents` (helpers cannot start helpers).
- A folder scheme and project rules, copied into a project by `/hub`.
- Windows is the main system. Mac has not been tested.
