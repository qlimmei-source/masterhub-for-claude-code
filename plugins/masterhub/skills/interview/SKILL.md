---
name: interview
description: A "who am I" interview. Claude interviews the person one question at a time and saves the answers in an about-me/ folder next to the project: raw answers, a summary, goals. Topics come in blocks, and the interview continues where it stopped; "do not record" means the answer is written nowhere. Use on /interview, /interview <block number>, or when the user says "let's do the interview".
argument-hint: "[block number or topic; empty means continue]"
---

# "Who am I" interview

Claude asks, the person answers (by voice or text), the answers are saved. Later any chat can read the summary and understand who it works with.

## Where things go

The `about-me/` folder in the current project. If it is missing, create it.

- `about-me/_progress.md`: the block and question where the interview stopped. An argument with a block number means start from that block.
- `about-me/log/<date>_<number>_<topic>.md`: raw answers: the question, the answer word for word, the time.
- `about-me/who_am_i.md`: the summary. The top 15-20 lines are what any chat should read before starting work.
- `about-me/goals.md`: goals.
- `about-me/rules_from_me.md`: the person's requests about how to work with them: the date and their words in quotes.
- Before editing the summary, copy the previous one into `about-me/_archive/` with the date.

## How it goes

1. First line: which block, about how many minutes, and "say "enough" and we stop".
2. **One question at a time.** Short, human, no preamble. Start every interview question with the 🎙 badge.
3. After an answer, at most one follow-up, only if the answer is short or has an interesting thread. No evaluation, no praise, no retelling of the answer.
4. Write the answer into the block file word for word right away. Do not report this every time.
5. "Do not record": the answer is written nowhere. "This is private": write it into `about-me/private/`; do not copy it into other files or into the chat.
6. Never ask for passport numbers, bank accounts, cards, passwords or codes.
7. A strange word in an answer (especially with voice input) may be a recognition error: show it word for word and ask, do not guess.
8. A block takes 20-40 minutes. At the end: the summary goes into the right file, the person's corrections go into `rules_from_me.md`, the person gets 3-5 lines "what was added", and `_progress.md` names the next block. "Enough" in the middle of a block does the same, with the question number.
9. A new fact contradicts an earlier record: ask which is true; the old one goes to `_archive/`.

## Blocks

| # | Block | Goes to |
|---|---|---|
| 1 | Who you are now: what you do, whether you study or work, what you call yourself | who_am_i |
| 2 | Goals: for the year, for the next months, what gets in the way | goals |
| 3 | Path: studies, first jobs, turning points | who_am_i |
| 4 | Work and projects: what you made, what you are proud of | who_am_i |
| 5 | How you work: the day, the routine, tools, what speeds you up, what breaks it | who_am_i |
| 6 | Taste: what you like, references, what you consider a good level | who_am_i |
| 7 | What Claude must know so as not to annoy you | rules_from_me |

Invent the questions inside a block as you go, from the answers. The start of block 1:

1. How do you introduce yourself to a new person in one sentence?
2. What do you do now: study, work, your own projects?
3. What do you do better than most people around you?
4. What do you not do and do not want to do?
5. What do you need Claude for: what do you want to get with its help in a month?

## What next with the summary

When `who_am_i.md` is ready, offer in one line to put a short version (15-20 lines) into the project rules (`CLAUDE.md`), so every chat knows the main things. Edit the rules only on the person's word.
