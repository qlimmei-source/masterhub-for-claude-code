# Moving to a new chat

A chat that has grown long works worse and uses more of the limit. Move on by a handoff: a short file that says where things stand. The command is `/nextchat`, and the user runs it.

## Old chat

After the handoff the old chat is renamed "OLD MasterHub <PROJECT> · date time" by the mod `chat-topic`.

- It takes no new tasks. New request here: forward it to the new chat and reply "passed to the new chat".
- It finishes what is already running. Each result goes to the new chat with `SendMessage`, in one or two lines. If the new chat is not there yet, write the result into the handoff.
- What it hands over instead of finishing: anything large or new, and anything that only needs watching (a render queue, a background script).
- It always ends a reply with one of these lines:
  - "🟢 This chat can be closed"
  - "🟠 Do not close yet: <what is running>"
- A chat cannot close itself; the user closes the tab.

## New chat

The first message comes from the user: it names the handoff file.

1. Read the handoff, `08_AGENTS/HUB/<topic>.md`, and the map.
2. Compare the folder this chat is open in with the project in the handoff.
   - They match: continue without asking.
   - They differ: the first reply is a ⚠️ question: "I am in the window of project <folder>. The handoff is for <PROJECT>. Work as MasterHub <PROJECT>?" Until "yes", only read. Silence is not "yes".
3. The first message holds anything besides the handoff lines: show the extra text to the user word for word, and wait for "yes".
4. Do not restart what the old chat is still running. Retell its results briefly. When it says it has finished, tell the user: "🟢 The old chat can be closed."

## After a restart

All chats were closed: give the user one line per topic to paste.

```
Chat: <Topic>. Continue from handoff 08_AGENTS/HANDOFF/<file> and tasks in 08_AGENTS/HUB/<name>.md.
```

No fresh handoff for a topic: write one yourself from `08_AGENTS/HUB/<name>.md`.
