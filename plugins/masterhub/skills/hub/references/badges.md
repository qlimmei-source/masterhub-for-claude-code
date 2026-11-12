# Colored badges

The mod `blocks` paints every block of a reply (paragraph, list item, table, code window) by the badge at its start. Put the badge first in the block. Without the mod the same badges still help the eye.

| Badge | Meaning | Look |
|---|---|---|
| ⚠️ | Table "Your answer needed" | Bright red fill with a frame, always first; an answer field under each numbered question |
| ☢️ | A yes-or-no question about one of four weighty things: deleting, a paid run, sending something out, a new access | Solid muted red with a light frame |
| 🎙 | An interview question (`/interview`) | Lime fill with a bright frame |
| 🔴 | Urgent: a deadline, a problem | Red fill |
| 🟡 | Needed from the user | Yellow fill |
| 🟢 | Done | Green fill |
| 🔵 | The main point, a decision | Blue frame |
| 🟠 | A nuance that stands out from the context | Orange frame |
| 💡 | An idea, a way to do better | Pink frame |
| ⚙️ | Settings, mods, scripts | Indigo frame |
| 🖼 | A picture to open | Violet fill with a frame |
| 🎬 | A video to open | Violet fill with a frame |
| 📁 📄 📝 🧩 🔗 | Folder, document, text, SVG, link | Teal frame; the path window below stays inside it |
| none | Ordinary text and code windows | Barely visible gray |

Three levels guide the eye. A fill means read and answer. A frame means read if you need it. Gray is the background.

A reply is 3–6 blocks, the question first. Facts and comparisons go to a file. `/blocks` turns the colors off and on, and shows this legend.

## A question for the user

The user may work for hours and miss a question in running text.

- A question that needs an answer goes at the very top, in a one-column table headed "⚠️ Your answer needed". One such table per reply.
- Questions are numbered from 1 in each reply, and each has a default option. The user can answer "all default" or "default 1, 3".
- A bare number without the question's text is never written.
- A list inside a question goes in separate table rows, indented with four U+2800 blank characters before "•". Ordinary spaces are swallowed by the table, and `<br>` does not work there.
- Still no answer: repeat the whole question in the next message. Never write "see my earlier question".
- `blocks` draws an answer field under each numbered question, in the same frame as the question: the user types an answer (empty means default), can attach a screenshot or a file, and presses "Send answers" once for all. The answers come back as one message: "1. ... 2. default". After sending, the questions turn gray.
- A question about a specific file carries that file right under it, so the user does not scroll to find it: a table row that starts with the file's badge and a link from the project root. `blocks` draws it as a violet frame with Open buttons inside the red table. No file yet: make it first, then ask.

```
| ⚠️ Your answer needed |
|---|
| 1. Send the report today? Default: yes. |
| ⠀⠀⠀⠀• Report: draft → final |
| ⠀⠀⠀⠀• Price list: stays as it is |
```

## A weighty question: ☢️

Four things are done only after the user's own "yes" to this very action: deleting, a paid run, sending something out, a new access. Ask first, in words, in a block that starts with ☢️: what, how many, the price, and "yes / no / your answer". Act after "yes".

## Links and paths

- Link from the project root, without `../`. A space is `%20`.
- A folder link ends with `/`: `[Reports](02_WORK/report/)`. Without the slash the editor treats it as a file.
- Under each link, put the full path in its own code block. `blocks` turns it into a line with buttons: click the path to copy it, or press Open.
- Links go in a list and not in a table, because a code block does not fit in a table cell.
- Show only files inside the project, never in a temporary folder. Do not open files for the user; give the link.
