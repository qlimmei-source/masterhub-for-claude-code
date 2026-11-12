# Set up a hub in a project

Read this only when the project has no `08_AGENTS/HUB/_chats.md`, or the argument starts with `setup`.

## 0. First, say what this is

Before the first question, show the user this scheme in their language, then go on:

```
What it is     this chat becomes the main chat of THIS project folder: you write here, it hands work to helpers
What changes   tasks are recorded word for word, work goes to folders, nothing is deleted or sent without your word
One project    one main chat per project; other projects get their own when you run /hub there
```

## 1. Look before you create anything

Look at the project folder.

- Empty, or only `.claude/`, `CLAUDE.md`, `README.md`: go on.
- The folder already holds the user's work: ask one question first, and create nothing until the answer. "I will add the hub folders next to yours and move nothing. Go ahead?"

Existing files are never overwritten. Whatever already exists stays as it is; if a template file has the same name, show the user and ask. An existing `CLAUDE.md` gets the template text added at the end, and everything already in it stays.

## 2. Read the rules that are already there

The user may have rules of their own. Read, if they exist:

- every `CLAUDE.md` in the folders above the project, up to the top of the disk;
- the user's personal `CLAUDE.md`, the one in the `.claude` folder of their home folder;
- the project's own `CLAUDE.md`, if there is one.

Compare them with the template's sections `{#safety}` and `{#better-to-ask}` and with the folder rules. The user's rule holds; the template adapts to it and never contradicts it. Example: the user's rule says "move things to the folder `_TO_DELETE` instead of deleting". Then the template's line on deleting says the same and names that folder, and `_archive/` stays only for old versions.

- Rules agree, or the user's rule is stricter: write it into the template's line as the user has it.
- The user's rule is looser than a safety rule of the template: keep the user's rule, and in the questions of step 3 say in one line what differs.
- In section `{#user-rules}` of the new `CLAUDE.md`, list the files you read and, for each, what it changed in the template. None found: leave "(none found)".

## 3. Ask, in one ⚠️ table

One table, each question with a default:

1. **Topics.** Topics come from the argument after `setup`, separated by commas. If there are none, offer 5–9 topics based on the project's README, handoffs and list of work. A topic has a one-word name in the user's language ("Design", "Report", "Prices") and a one-word English name for files (`design`, `report`, `prices`).
2. **Sources outside the project.** "Do your working files (layouts, photos, recordings, earlier versions) live in a folder outside this project? Give the path, or answer 'none'." Default: none.
3. **What differs from your rules,** if step 2 found something: one line each, "your rule → what the hub file will say".

Wait for "yes" or a correction.

## 4. Copy the template

The template is at `${CLAUDE_PLUGIN_ROOT}/skills/hub/template/`. Copy it in one step with the script for the computer, `<project>` being the full path to the project folder:

- Windows: `powershell -NoProfile -ExecutionPolicy Bypass -File "${CLAUDE_PLUGIN_ROOT}/skills/hub/scripts/copy_template.ps1" -Project "<project>"`
- Mac and Linux: `bash "${CLAUDE_PLUGIN_ROOT}/skills/hub/scripts/copy_template.sh" "<project>"`

The script only creates folders and copies files. A file that already exists is kept and reported as "kept"; nothing is deleted or overwritten, and nothing goes to the internet. The last line says how many were copied and kept.

If the script cannot run (the command is refused or fails), copy the files below another way and skip every file that exists: with one shell command of your own that never overwrites, or file by file with the Read and Write tools.

```
00_START_HERE.md
CLAUDE.md
GLOSSARY.md
01_IN/.gitkeep
02_WORK/.gitkeep
03_FINAL/README.md
04_REF/.gitkeep
08_AGENTS/HUB/README.md
08_AGENTS/HUB/_chats.md
08_AGENTS/HANDOFF/.gitkeep
08_AGENTS/checks/.gitkeep
08_AGENTS/snapshots/.gitkeep
08_AGENTS/build/.gitkeep
09_ARCHIVE/.gitkeep
```

`CLAUDE.md` was kept because the project had one: add the template's text at its end with the Edit tool.

## 5. Fill in the copies

- Replace `<PROJECT>` with the project name in capitals (the folder name unless the user named it).
- Translate the body text into the user's language. Headings stay exactly as they are: the English name, the Russian name and the tag like `{#safety}`. Other chats find a section by any of the three. The user writes in a third language: add the name in that language before the tag, and keep the other two. Folder names and the word `MasterHub` stay as they are too.
- Write the rules found in step 2 into section `{#user-rules}` and the lines they change.
- Sources outside the project: a row per folder in section `{#sources}` of `00_START_HERE.md`. Then tell the user in one line that Claude may ask for access to that folder; to allow it once for all chats of this project, they can type `/add-dir <path>`.

## 6. Add each topic

For every topic:

- `02_WORK/<name>/` with a short `README.md` (what this topic does);
- `08_AGENTS/HUB/<name>.md` with a header: what the topic does, its main files;
- one row in `08_AGENTS/HUB/_chats.md`;
- one row in section `{#directions}` of `00_START_HERE.md`;
- the name in sections `{#chats}` and `{#topics}` of `CLAUDE.md`.

## 7. Check

- No `<PROJECT>`, `<topic>` or other placeholder is left in the new files, apart from the patterns the rules describe on purpose.
- Every path in the new files points to a folder that exists.
- Every tag the start message and the skill use is there: `{#chats}`, `{#safety}`, `{#approval}`, `{#language}`, `{#topics}`, `{#user-rules}` in `CLAUDE.md`; `{#directions}`, `{#sources}` in `00_START_HERE.md`.

## 8. Tell the user

One short reply about what it means for their work, then what was created. A scheme first:

```
you  ──►  this chat (MasterHub <PROJECT>)  ──►  helpers do the work in the background
                │
                ├─ every task: written word for word in 08_AGENTS/HUB/
                ├─ results:    02_WORK/<topic>/, finished things in 03_FINAL/
                └─ your word:  "yes", "ok", "send it" approves; nothing is deleted or sent without it
```

Then:

- This chat is the main chat of this project only. Next time, type `/hub` here (full name `/masterhub:hub`). Another project gets its own main chat.
- By default helpers do the work in the background, so one chat is enough.
- Your own rules from step 2 are in force: say which ones were found, in one line.
- To open a separate chat for a topic, paste this as its first message:

```
Chat: <Topic>.
Read CLAUDE.md, section "Chats and hub" · «Чаты и хаб» {#chats}, and 08_AGENTS/HUB/<name>.md.
Tasks come from MasterHub <PROJECT>. Wait for them.
```

Translate the other words of this message for the user. Keep `Chat:`, both names of the section, the tag `{#chats}` and the paths as they are: the topic chat finds the section by any of them.

The mod `chat-topic` shows the topic under the input box and names the main chat by itself. Without the mod, the chat can be renamed by hand.
