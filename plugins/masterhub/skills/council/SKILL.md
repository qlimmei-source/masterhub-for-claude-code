---
name: council
description: The council, a review for any work that goes to other people (proposal, presentation, client letter, post, script, web page). Breaks down the task, picks the key roles for this project, runs the writer and independent critics as separate agents, polishes the result, and only then shows it to the user. The medium council runs by itself on text for other people; the big council runs only when the user asks for it. Run with /council.
argument-hint: "[what to review]"
---

# The council

Roles played in one head agree with themselves. A separate agent per role has its own view and does not see what the others said. The writer should not be the first one to read the text through the eyes of the client.

In a project with a hub, the main chat starts the agents, because helpers do not start helpers. Without a hub, the chat itself does. Mechanical work (building, moving files, layout checks) goes without a council.

## The user's word outranks the critics

- What the user stated as a decision ("it will cost this much", "do it this way") goes in as they said it. Critics neither change nor add to it. The exception is a plain error: a contradiction, a wrong number, a broken link. Fix it and tell the user in one line what and why.
- Critics' notes are recommendations. A note that makes a sentence clearer without changing its meaning: the writer applies it. A note that changes the meaning or adds a point, condition, promise, date or number: it is not applied, and it goes to the user as a question with the option "leave as you said".
- Where the user asked for advice ("I don't know", "how would it be better?"): offer options, your recommendation first. That is the place for the critics' ideas.
- Before adding anything "by default", check: did the user say this? If not, the default is "do not add".

## 1. Break down the task: 5 lines, before starting

- What is being made and in what form (file, version).
- Who actually reads it, named from the project: "the client's finance director", "a college teacher", "a viewer on YouTube".
- What the reader should do after reading: "approve the budget", "sign up for the course".
- Sources of facts (brief, meeting notes, transcript, client's documents) and the user's rules.
- What is off limits: words and moves the user has already objected to.

## 2. Pick the roles for this task

Roles are picked anew each time. A role earns its place by finding a real problem in this work, not by adding to the count.

**Writer (1 agent, opus, effort high):** the best master of exactly this thing: a proposal writer, a scriptwriter, an art director, a report editor, a UX writer. The task gives the role in one sentence and the breakdown.

**Critics (2–4 agents, sonnet, effort medium, in parallel).** Always these two:

- **"Reader":** the real addressee from the breakdown. Item by item: is it clear what I get, do I want it, where did I stumble. And the order: after each section, what is my question now, and does the next section answer it.
- **"Editor":** every sentence against `${CLAUDE_PLUGIN_ROOT}/skills/hub/references/plain-language.md` and the user's rules.

Plus 1–2 for the task, for example:

| Work | Add |
|---|---|
| Proposal, estimate | "The one who pays": what is the money for, is the amount of work visible. "Fact checker": every fact and promise comes from a source |
| Presentation, client report | "The client's manager", who reads it in 2 minutes. "Fact checker" |
| Script, video | "Film editor": pace, what is visible in the frame. "Viewer" of the first 3 seconds |
| Brand, visuals | "Art director": unity, taste. "Print and screen technician": formats |
| Site, page | "UX designer": the visitor's path. "Developer": what can be built and what cannot |
| Post, PR | "Journalist" or "subscriber": does it catch. "Client's lawyer", if there is a risk |

The role list is one line in the breakdown: "Writer: proposal writer · Critics: Client's finance director, Editor, Fact checker".

## 3. Run

1. The writer writes and builds a version, without putting it in `03_FINAL/`. The report is the whole text in order, as the reader sees it.
2. The critics run in parallel, each as a separate agent. Each gets only the text, the breakdown, their role and the checklist, not the whole project. Each must find at least one real weakness with a concrete edit "before → after", or explain why there is none.
3. Whoever started the agents merges the notes: settles contradictions by the breakdown and drops anything made up. Each note is checked against the user's words. Only clarity edits go back to the same writer. Notes that change the meaning go to the user as questions.
4. Read the result yourself, spot-checking. Then `03_FINAL/` and one line to the user: what is ready, who took part.

## 4. The big council: only when the user says so

Three writers with different angles (for a proposal: seller, brand strategist, client's voice) write their own versions. Critics grade them blind, without names. The best parts are merged into one, and that one goes through step 3. It costs 3–4 times as much as a single task, so never turn it on by yourself.

## Saving usage

- Critics run on sonnet at effort medium, the writer on opus at effort high (the `model` and `effort` settings when starting an agent). No more than four critics.
- A critic gets only the text and the checklist. Follow-up edits go to the same writer, who remembers the files.
- Cost figures here are the author's rough estimate: the medium council adds about half to the cost of a task, and one extra round of edits from the user costs about as much as the whole task.
