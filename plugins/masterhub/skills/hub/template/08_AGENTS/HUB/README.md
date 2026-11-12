# Hub: where tasks come in

1. The user writes a task, an edit or a big idea in **MasterHub**, the main chat.
2. The main chat sorts it by topic: an item in `08_AGENTS/HUB/<topic>.md` with the time, the user's words verbatim, what the topic must do, and the status "new".
3. A helper takes the item, or the main chat sends it to the topic's open chat.
4. The one doing the work marks it "taken", then "done" with the files.
5. The user tells a chat about another topic: the chat adds an item to that topic's file and tells its chat.

Item format:

    ## YYYY-MM-DD HH:MM · new
    User: "…" (word for word)
    For this topic: …
    From: MasterHub
