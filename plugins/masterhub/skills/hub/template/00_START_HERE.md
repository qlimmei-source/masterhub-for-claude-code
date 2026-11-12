# <PROJECT>: map

One page that says where the current things are. After every move, fix the links here.
New tasks go through MasterHub <PROJECT> and the hub.
Each heading carries its English name, its Russian name and a tag like `{#sources}`: the fixed address of the section. Keep headings exactly as they are.

## Now · Сейчас {#now}

- Deadline: <date> for <what is due>
- Main thing: [<thing>](02_WORK/<topic>/<file>)

## Directions: one folder per chat · Направления {#directions}

| Direction | Folder | Current | Tasks |
|---|---|---|---|
| <topic> | [02_WORK/<topic>/](02_WORK/<topic>/) | [<file>](02_WORK/<topic>/<file>) | [tasks](08_AGENTS/HUB/<topic>.md) |

## Sources outside the project · Исходники {#sources}

The user's own working folders that stay where they are: layouts, photos, recordings, earlier versions. Agents read them there and copy into the project only what the task needs.

| What | Folder | Note |
|---|---|---|
| (none) | | |

## What is where · Что где {#what-is-where}

- `01_IN/`: what came from outside, as it came (briefs, contracts, recordings). Read only.
- `02_WORK/`: the work, one folder per direction. Only the current version is in view. Build files go to `_work/`, old versions to `_archive/` next to them.
- `03_FINAL/`: what leaves the project, by order of sending. The log is `03_FINAL/README.md`.
- `04_REF/`: references, resources, other people's code.
- `08_AGENTS/`: the agents' kitchen: `HUB/`, `HANDOFF/`, `checks/`, `snapshots/`, `build/`.
- `09_ARCHIVE/`: storage for things taken out as a whole.

## Rules for folders · Правила папок {#folder-rules}

- The root holds at most 4 files: this map, `CLAUDE.md`, `GLOSSARY.md`, and `ROADMAP.md` if a plan is needed.
- A new top-level folder needs the user's "yes".
- A living file keeps one name so that links stay valid. Dated versions go to `_archive/` next to it.
