import { atom, memberOf, read, update } from 'claude-code'
import type { Register } from 'claude-code'

// Claude's reply is cut into blocks (paragraph, list item, table, code window);
// the engine draws each block, the mod only puts it on a badge of the right color.

const isOff = atom({ plugin: 'blocks', key: 'isOff' } as const, false)

type Kind =
  | 'consent' | 'ask' | 'urgent' | 'warn' | 'need' | 'main' | 'done' | 'idea'
  | 'image' | 'video' | 'link' | 'tech' | 'code' | 'header' | 'plain' | 'interview'
type Block = { kind: Kind; text: string; isTable: boolean }
type Look = { bg?: string; border?: string; label: string; mark: string }

// Three levels, so the eye knows where to read. A fill means "read and answer"
// (a question also has a frame, the loudest of all); a frame without a fill means
// "read if you need it"; a barely visible gray is ordinary text and code.
// Pictures and videos have a fill and a frame of their own color: "open and look".
export const LOOK: Record<Exclude<Kind, 'header'>, Look> = {
  // ☢️ is a question about the four weighty things: deleting, a paid run, sending something out, a new access.
  // A solid muted red with a light red frame, so it never blends with an ordinary question.
  consent: { bg: '#a33d4e', border: '#dba0a9', mark: '☢️', label: 'weighty: deleting, paid, sending out, new access; answer yes or no' },
  ask: { bg: '#ff1f3d4d', border: '#ff3b4f', mark: '⚠️ or 🆘', label: 'your answer needed' },
  urgent: { bg: '#e5484d38', mark: '🔴', label: 'urgent, deadline, problem' },
  need: { bg: '#e0b40033', mark: '🟡', label: 'needed from you' },
  main: { bg: '#3e8ef71f', border: '#3e8ef7', mark: '🔵', label: 'the main point, a decision' },
  warn: { border: '#f07619', mark: '🟠', label: 'a nuance, stands out from the context' },
  done: { bg: '#30a46c33', mark: '🟢', label: 'done' },
  idea: { border: '#e0569a', mark: '💡', label: 'an idea, a way to do better' },
  // 🎙 is an interview question: a lime fill with a bright frame, a color nobody else uses. The fill is 40 %
  // so that it reads on both the dark and the light theme.
  interview: { bg: '#a3e63566', border: '#c6f432', mark: '🎙', label: 'an interview question' },
  tech: { border: '#7c7cf0', mark: '⚙️', label: 'settings, mods, scripts' },
  image: { bg: '#9b5de533', border: '#9b5de5', mark: '🖼', label: 'a picture to open and look at' },
  video: { bg: '#7c5ce62e', border: '#7c5ce6', mark: '🎬', label: 'a video' },
  link: { border: '#12a594', mark: '📁 📄 📝 🧩 🔗', label: 'folder, file, link' },
  code: { bg: '#8b8d981a', mark: 'code window', label: 'prompt, path, command' },
  plain: { bg: '#8b8d980d', mark: 'no badge', label: 'ordinary text' },
}

const MARKS: [RegExp, Kind][] = [
  [/^(☢️|☢)/u, 'consent'],
  [/^(⚠️|⚠|🆘)/u, 'ask'],
  [/^🎙/u, 'interview'],
  [/^🔴/u, 'urgent'],
  [/^🟠/u, 'warn'],
  [/^🟡/u, 'need'],
  [/^🔵/u, 'main'],
  [/^🟢/u, 'done'],
  [/^(💡|🟣)/u, 'idea'],
  [/^🖼/u, 'image'],
  [/^🎬/u, 'video'],
  [/^(📁|📂|📄|📝|🧩|🔗)/u, 'link'],
  [/^(⚙️|⚙)/u, 'tech'],
]

// A code window under a picture, video or file is its path: it stays on their badge.
const KEEPS_CODE: Kind[] = ['image', 'video', 'link']

const LIST_ITEM = /^ {0,1}([-*+]|\d+[.)])\s+/
const FENCE = /^\s*(```|~~~)/

// A code window with one path under a link is that link's path: it stays in one block with it, whatever the
// color. Otherwise a list item with a link and the window under it became two blocks with two lines of buttons.
function belongsToLink(text: string, code: string[]): boolean {
  const body = code.slice(1, -1).join('\n').trim()
  if (!body || body.includes('\n') || !DRIVE_PATH.test(body)) return false
  return /\]\((?!https?:)[^\s]+\)/i.test(text)
}

export function split(text: string): Block[] {
  const lines = text.split('\n')
  const at = (k: number) => lines[k] ?? ''
  const out: Block[] = []
  let cur: string[] | null = null
  const close = () => {
    if (cur && cur.join('').trim()) out.push(make(cur.join('\n'), false))
    cur = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = at(i)
    if (FENCE.test(line)) {
      const code = [line]
      const mark = line.trim().slice(0, 3)
      while (++i < lines.length) {
        code.push(at(i))
        if (at(i).trim().startsWith(mark)) break
      }
      if (cur && (KEEPS_CODE.includes(classify(cur.join('\n'), false)) || belongsToLink(cur.join('\n'), code))) {
        cur.push(...code)
        continue
      }
      close()
      const prev = out[out.length - 1]
      if (prev && (KEEPS_CODE.includes(prev.kind) || (!prev.isTable && belongsToLink(prev.text, code)))) {
        prev.text += '\n' + code.join('\n')
      } else {
        out.push({ kind: 'code', text: code.join('\n'), isTable: false })
      }
      continue
    }
    if (line.trimStart().startsWith('|')) {
      close()
      const table = [line]
      while (i + 1 < lines.length && at(i + 1).trimStart().startsWith('|')) table.push(at(++i))
      out.push(make(table.join('\n'), true))
      continue
    }
    if (!line.trim() || /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      close()
      continue
    }
    if (LIST_ITEM.test(line) || /^#{1,6}\s/.test(line)) close()
    if (!cur) cur = []
    cur.push(line)
  }
  close()

  return merge(out)
}

// One thought, one badge: neighbouring blocks of one color, and list items
// without a badge under a block with a badge, are glued to it.
function merge(blocks: Block[]): Block[] {
  const out: Block[] = []
  for (const block of blocks) {
    const prev = out[out.length - 1]
    if (prev && !prev.isTable && !block.isTable && prev.kind !== 'header' && prev.kind !== 'code') {
      if (block.kind === prev.kind) {
        prev.text += '\n\n' + block.text
        continue
      }
      if (block.kind === 'plain' && prev.kind !== 'plain' && LIST_ITEM.test(block.text)) {
        prev.text += '\n' + block.text
        continue
      }
    }
    out.push({ ...block })
  }

  return out
}

function make(text: string, isTable: boolean): Block {
  return { kind: classify(text, isTable), text, isTable }
}

function classify(text: string, isTable: boolean): Kind {
  if (isTable) return /⚠️|🆘|Your answer needed/u.test(text) ? 'ask' : /^\s*\|\s*(?:\*\*)?🎙/u.test(text) ? 'interview' : 'plain'
  const lead = text.replace(LIST_ITEM, '').trimStart()
  if (/^\*\*▍/.test(lead)) return 'header'
  const bare = lead.replace(/^\*\*/, '')
  for (const [re, kind] of MARKS) if (re.test(bare)) return kind
  return 'plain'
}

// Links and code windows inside a badge. In VS Code any tree drawn by a mod disables clicking a link
// and the copy button of a code window, so the mod draws them itself: a path becomes a line with
// buttons, a code window gets a Copy button.
type Part = { type: 'path'; path: string; isFolder: boolean } | { type: 'code'; source: string; language: string }

const DRIVE_PATH = /^(?:[A-Za-z]:[\\/]|\/|~[\\/])\S/

function absolute(href: string, root: string): string {
  let path = href
  try { path = decodeURIComponent(href) } catch {}
  path = path.replace(/^file:\/\/\/?/i, '')
  if (DRIVE_PATH.test(path)) return path
  const base = root.replace(/[\\/]$/, '')
  return `${base}/${path.replace(/^\.\//, '')}`
}

function native(path: string): string {
  return /^[A-Za-z]:/.test(path) ? path.replace(/\//g, '\\') : path
}

// Mod elements do not accept control characters (a tab in a prompt and so on):
// a single one and the whole reply draws without badges. A tab becomes two spaces.
function clean(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\t/g, '  ').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '')
}

// One path, one line of buttons. A link and the code window under it give the same path, but the drive
// letter may differ in case. Compare without case and without the final slash; show the path from the code window.
function samePath(a: string, b: string): boolean {
  const key = (p: string) => p.replace(/[\\/]+$/, '').replace(/\//g, '\\').toLowerCase()
  return key(a) === key(b)
}

function addPath(out: Part[], path: string, isFolder: boolean, fromCode: boolean) {
  const twin = out.find((p): p is Extract<Part, { type: 'path' }> => p.type === 'path' && samePath(p.path, path))
  if (!twin) { out.push({ type: 'path', path, isFolder }); return }
  if (fromCode) twin.path = path
  twin.isFolder = twin.isFolder || isFolder
}

// A folder: a slash at the end, or no extension in the last part of the path.
function looksLikeFolder(path: string): boolean {
  if (/[\\/]$/.test(path)) return true
  const last = path.split(/[\\/]/).pop() ?? ''
  return !/\.[^.\s]{1,8}$/.test(last)
}

// The block's text without code windows, links replaced by their labels; paths and code separately, in order.
export function parts(raw: string, root: string): { prose: string; parts: Part[] } {
  const text = clean(raw)
  const out: Part[] = []
  const prose: string[] = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const fence = line.match(/^\s*(```|~~~)\s*([\w-]*)/)
    if (fence) {
      const body: string[] = []
      while (++i < lines.length && !(lines[i] ?? '').trim().startsWith(fence[1] ?? '```')) body.push(lines[i] ?? '')
      const source = body.join('\n').trim()
      if (!source) continue
      // "/blocks on" is a command, not a path: a path that starts with a slash has no spaces and at least two parts.
      const slashCommand = /^\//.test(source) && (/\s/.test(source) || !/^\/[^/\s]+\/\S/.test(source))
      if (!source.includes('\n') && DRIVE_PATH.test(source) && !slashCommand) {
        addPath(out, native(source), looksLikeFolder(source), true)
      } else {
        out.push({ type: 'code', source, language: fence[2] ?? '' })
      }
      continue
    }
    prose.push(line.replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, (whole, label: string, href: string) => {
      if (/^https?:/i.test(href)) return whole
      const path = native(absolute(href, root))
      addPath(out, path, looksLikeFolder(href), false)
      return `**${label}**`
    }))
  }

  return { prose: prose.join('\n').trim(), parts: out }
}

// A file right inside a question. A link in a table cell cannot be made clickable, so a question table
// that holds such a row is drawn as rows instead, and the file gets its own frame with the usual buttons.
// A file row starts with a badge; U+2800 indent before it is allowed.
const FILE_ROW = /^[\s⠀]*(🖼|🎬|📄|📝|📁|🧩|🔗)/u

// The file frame inside the red one: solid violet, white text, readable on the red fill.
export const FILE_FRAME = { bg: '#4a2596', border: '#c4a8ff', text: '#ffffff' }

export type AskRow = { type: 'text'; text: string } | { type: 'file'; kind: Kind; text: string }

function tableCells(table: string): string[] {
  return table
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !/^\|?[\s:|-]+\|?$/.test(line))
    .map(line => line.replace(/^\|/, '').replace(/\|$/, '').replace(/\\\|/g, '|').replace(/<!--[\s\S]*?-->/g, '').trim())
}

export function askRows(table: string): AskRow[] | null {
  const cells = tableCells(table)
  if (!cells.some(cell => FILE_ROW.test(cell))) return null

  return cells.map((cell, i) => {
    const mark = cell.match(FILE_ROW)?.[1]
    if (mark) return { type: 'file', kind: mark === '🖼' ? 'image' : mark === '🎬' ? 'video' : 'link', text: cell }
    return { type: 'text', text: i === 0 && !cell.startsWith('**') ? `**${cell}**` : cell }
  })
}

// An answer field under each question of the badge. A question is a table row that starts with a number:
// "1. ..." or "**1. ...**". Sub-items indented with U+2800 and file rows belong to the question above them.
// A question table without numbers is drawn as before.
const QUESTION = /^(?:\*\*)?\s*(\d+)[.)]\s+/

export type FormRow = AskRow | { type: 'question'; n: string; text: string }
export type FormGroup = { n: string | null; rows: FormRow[] }

export function askForm(table: string): FormGroup[] | null {
  const cells = tableCells(table)
  if (!cells.some(cell => QUESTION.test(cell))) return null

  const groups: FormGroup[] = [{ n: null, rows: [] }]
  cells.forEach((cell, i) => {
    const num = cell.match(QUESTION)?.[1]
    const mark = cell.match(FILE_ROW)?.[1]
    if (num) {
      groups.push({ n: num, rows: [{ type: 'question', n: num, text: cell }] })
      return
    }
    const row: FormRow = mark
      ? { type: 'file', kind: mark === '🖼' ? 'image' : mark === '🎬' ? 'video' : 'link', text: cell }
      : { type: 'text', text: i === 0 && !cell.startsWith('**') ? `**${cell}**` : cell }
    groups[groups.length - 1]?.rows.push(row)
  })

  return groups.filter(g => g.rows.length > 0)
}

// The frame of a group "question + sub-items + file + field": a thin pink line on the red badge. It is also the frame
// of the answer: the number and the question are its first line, so it is always clear which block belongs to which number.
// Once the answers are sent, the questions turn gray and lose their fields.
export const GROUP = { border: '#ff8fa0', bg: '#00000024' }
export const CLOSED = { bg: '#8b8d981f', border: '#8b8d9880', text: '#a3a5ae' }
const CLOSED_LOOK: Look = { bg: CLOSED.bg, border: CLOSED.border, mark: '⚪', label: 'questions closed' }
export const CLOSED_LABEL = { answered: '✔ answered, the field is closed' } as const

/** Gap above a row in a group: the question and its U+2800 sub-items sit tight, the rest gets one line. */
export function groupGap(row: FormRow, j: number): number {
  if (j === 0 || row.type === 'question') return 0
  return /^[⠀\s]/u.test(row.text) ? 0 : 1
}

/** A row without markup for gray text: no asterisks, a link becomes its label. */
export function flat(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, '').replace(/\*\*/g, '').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1')
}

// The question's text for "Copy question": no asterisks, a U+2800 indent becomes two spaces, a link becomes label and path.
export function questionText(group: FormGroup): string {
  return group.rows
    .map(row => row.text
      .replace(/\*\*/g, '')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1 ($2)')
      .replace(/^[⠀]+/u, m => '  '.repeat(Math.ceil(m.length / 4)))
      .trimEnd())
    .join('\n')
}

// One message from all answers: "1. answer", an empty field is "default"; all empty is "all default".
// Files go as paths under their answer: a plugin cannot attach the file itself to a message
// (pasted images and @file mentions are not expanded for a plugin's prompt), and Claude opens a path on its own.
export function answerText(numbers: string[], answers: Record<string, string>, files: Record<string, string[]> = {}): string {
  const lines = numbers.map(n => ({ n, text: (answers[n] ?? '').trim(), files: files[n] ?? [] }))
  if (lines.every(l => !l.text && l.files.length === 0)) return 'all default'
  const out = lines.map(l => {
    const head = `${l.n}. ${(l.text || (l.files.length ? 'answer in the files' : 'default')).replace(/\n/g, '\n   ')}`
    return [head, ...l.files.map(f => `   📎 ${f}`)].join('\n')
  })
  if (lines.some(l => l.files.length)) out.push('', 'Files for the answers are at the paths above; open them.')
  return out.join('\n')
}

// Paths from the output of the file picker and the clipboard script: one per line.
export function pathsOf(stdout: string): string[] {
  return stdout.split(/\r?\n/).map(l => l.trim()).filter(l => DRIVE_PATH.test(l))
}

// The answer card under a question. The editor's input field is a single line without padding or height of its own,
// so the mod puts it into a card with a frame, padding and a width narrower than the badge. A saved answer is a green
// frame and ✅ at the question.
// Width without max-width (Box has none): the card and an empty neighbour share one row. The card gets base characters
// and a grow share of the rest, the neighbour gets spaceGrow: at a ~1600 px badge the card is about 34 %, at 600 px about 70 %.
// The field looks like the chat's input box: a tall rounded frame, the text and ✓ on top, attached files below,
// "Paste screenshot" and "File..." at the bottom inside the frame. Ctrl+V of a picture into the field itself never reaches
// the mod, so a screenshot is pasted with a button. rows=3 is passed to the field: an editor that supports it draws three lines.
export const CARD = {
  base: 56, grow: 1, spaceGrow: 8,
  bg: '#15151bcc', border: '#ff8fa0', head: '#ffc2cb', file: '#d9c8ff',
  doneBg: '#30a46c33', doneBorder: '#3dd68c', doneHead: '#6ff0a8',
  fieldBg: '#191a1b', fieldBorder: '#ff8fa08c', fieldPadY: 0.45, fieldRows: 3.2,
  pillBg: '#2a2b2c', pillBorder: '#ff8fa066', donePillBorder: '#3dd68c66',
}
export const SAVE_LABEL = '✓'
export const PASTE_LABEL = '🖼 Paste screenshot'
export const FIELD_ROWS = 3

// What is typed into the fields lives in the mod's memory, by message and question number: a redraw (scrolling,
// a new reply) does not wipe it. Writing it to state is not needed here: that would redraw the badge on every key.
const typed = new Map<string, Record<string, string>>()

const sent = atom({ plugin: 'blocks', key: 'sent' } as const, false)
const copied = atom({ plugin: 'blocks', key: 'copied' } as const, false)
const opened = atom({ plugin: 'blocks', key: 'opened' } as const, false)
const saved = atom({ plugin: 'blocks', key: 'saved' } as const, '')
const files = atom({ plugin: 'blocks', key: 'files' } as const, [] as string[])
const changing = atom({ plugin: 'blocks', key: 'changing' } as const, false)
export const COPIED_COLOR = '#30a46c'

// A tall code window is folded to CODE_FOLD lines; one to three lines more are not folded, the button costs more than them.
export const CODE_FOLD = 12
const CODE_SLACK = 3

export function lines(n: number): string {
  return n === 1 ? 'line' : 'lines'
}

function shortName(path: string): string {
  const bits = path.replace(/[\\/]+$/, '').split(/[\\/]/)
  const name = bits[bits.length - 1] ?? path
  return /[\\/]$/.test(path) ? `${name}/` : name
}

// What the editor opens itself (text, code, pictures): Open shows it in the editor.
// Everything else (zip, mp4, pdf and so on): Show, in the file manager.
const EDITOR_EXT = /\.(md|txt|html?|css|js|mjs|ts|tsx|json|jsonl|ya?ml|py|ps1|sh|bat|csv|tsv|log|svg|png|jpe?g|gif|webp|bmp|ico)$/i

export function inEditor(path: string): boolean {
  return EDITOR_EXT.test(path)
}

// Video and PDF do not open from a link in the chat: Watch starts the file in the system's default program.
const PLAY_EXT = /\.(mp4|mov|m4v|webm|mkv|avi|mp3|wav|m4a|pdf)$/i

export function playable(path: string): boolean {
  return PLAY_EXT.test(path)
}

// cmd reads these characters as commands, so a path holding one never goes through it.
const CMD_SPECIAL = /[&|<>^"%!]/

function legend(): string {
  return Object.values(LOOK).map(l => `${l.mark}: ${l.label}`).join('\n')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'blocks',
      description: 'Colored badges in Claude\'s replies: turn them on or off and show the colors',
    })

    return next(e)
  })

  on('command.run', { command: 'blocks' }, async $ => {
    const now = await update($, isOff, off => !off)
    const head = now ? 'Badges are off. To turn them on: /blocks.' : 'Badges are on. To turn them off: /blocks.'

    return { text: now ? head : `${head}\n\nColors by importance:\n${legend()}` }
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.props.isSummary || (await read($, isOff))) return next(e)
    const blocks = split(e.props.text)
    if (blocks.length === 0) return next(e)

    // A block's text is drawn by the Markdown element: the engine's own node (next) came out
    // empty inside a badge in VS Code.
    const elements = $.ui.resolve(e)
    const { Box, Markdown, Text, Button, Code } = elements
    // The input field exists in the terminal, the desktop app and VS Code; the phone app has none, so there the badge is as before.
    const Input = e.surface !== 'mobile' && 'Input' in elements ? elements.Input : undefined
    const root = await $.session.root()
    const isWindows = /^[A-Za-z]:/.test(root)
    const run = (argv: string[]) => { void $.process.run(argv).catch(() => undefined) }
    const script = (name: string) => `${$.plugin.root.replace(/[\\/]+$/u, '')}/scripts/${name}`
    const copy = (text: string, surface: typeof e.surface) => { void $.ui.copy({ text, surface }) }
    // A folder opens in the file manager; a file the editor cannot show is selected there.
    // On Windows, scripts/reveal.ps1 raises the window, otherwise it opens behind the editor.
    const reveal = (path: string, isFolder: boolean) => {
      if (!isWindows) { run(isFolder ? ['open', path] : ['open', '-R', path]); return }
      void $.process.run(
        ['powershell.exe', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', script('reveal.ps1')],
        { env: { BLOCKS_PATH: path, BLOCKS_SELECT: isFolder ? '0' : '1' } },
      ).then(done => {
        if (done.exitCode === 0) return
        const note = done.exitCode === 3 ? 'The window opened but stayed behind the editor: check the taskbar' : 'The file manager window did not open'
        try { $.ui.toast(`📂 ${note}`) } catch {}
      }).catch(() => {
        run(isFolder ? ['C:\\Windows\\explorer.exe', path] : ['C:\\Windows\\explorer.exe', `/select,${path}`])
      })
    }
    // The editor did not open the file: show it in the file manager and say so.
    const openFile = (path: string) => {
      const fallback = () => {
        try { $.ui.toast('📂 The editor did not open the file, showing it in the file manager') } catch {}
        reveal(path, false)
      }
      if (isWindows && CMD_SPECIAL.test(path)) { fallback(); return }
      void $.process.run(isWindows ? ['cmd', '/c', 'code', '-r', path] : ['code', '-r', path])
        .then(done => { if (done.exitCode !== 0) fallback() })
        .catch(fallback)
    }
    const play = (path: string) =>
      run(isWindows ? ['C:\\Windows\\explorer.exe', path] : ['open', path])
    // The code window's Copy button shows "✓ copied" for 3 seconds.
    const copyCode = (source: string, surface: typeof e.surface, id: string) => {
      copy(source, surface)
      const mark = memberOf(copied, { requestId: `${e.requestId}:${id}` })
      void update($, mark, () => true).catch(() => undefined)
      try { setTimeout(() => { void update($, mark, () => false).catch(() => undefined) }, 3000) } catch {}
    }
    // A click on the path itself copies it.
    const copyPath = (path: string, surface: typeof e.surface) => {
      copy(path, surface)
      try { $.ui.toast('📋 Path copied') } catch {}
    }

    const drawn = []
    for (const [i, block] of blocks.entries()) {
      if (block.kind === 'header') {
        drawn.push(<Box key={`b${i}`} marginBottom={1}><Markdown text={block.text} /></Box>)
        continue
      }
      // Questions of a badge are drawn in groups on every surface (the phone too); the answer field only where Input exists.
      const groupsAll = block.kind === 'ask' && block.isTable ? askForm(clean(block.text)) : null
      const asked = !groupsAll && block.kind === 'ask' && block.isTable ? askRows(clean(block.text)) : null
      // Answers sent: every question is "answered", gray and without a field.
      const sentKey = `${e.requestId}:${i}`
      const isSentNow = groupsAll ? await read($, memberOf(sent, { requestId: sentKey })) : false
      const numbered = (groupsAll ?? []).filter(g => g.n)
      const allClosed = isSentNow && numbered.length > 0
      const look = allClosed ? CLOSED_LOOK : LOOK[block.kind]
      const { prose, parts: items } = asked || groupsAll
        ? { prose: '', parts: [] as Part[] }
        : block.isTable
          ? { prose: clean(block.text), parts: [] as Part[] }
          : parts(block.text, root)
      const copiedIds = new Set<string>()
      const openedIds = new Set<string>()
      const partRow = (item: Part, id: string, inFrame = false) => {
        // A code window is the Code element: every line is its own and long ones wrap. Copy is a button at the top
        // right, "✓ copied" after a click. A tall window is folded to CODE_FOLD lines; the button below unfolds it.
        if (item.type === 'code') {
          const isCopied = copiedIds.has(id)
          const all = item.source.split('\n')
          const isLong = all.length > CODE_FOLD + CODE_SLACK
          const isOpen = openedIds.has(id)
          const shown = isLong && !isOpen ? all.slice(0, CODE_FOLD).join('\n') : item.source
          return (
            <Box key={id} flexDirection="column" marginTop={1}>
              <Box flexDirection="row" justifyContent="flex-end">
                <Button key={`${id}k`} plain onPress={p => copyCode(item.source, p.surface, id)}>
                  <Text color={isCopied ? COPIED_COLOR : undefined} dimColor={!isCopied} bold={isCopied}>{isCopied ? '✓ copied' : '📋 Copy'}</Text>
                </Button>
              </Box>
              <Code source={shown} language={item.language || undefined} wrap="wrap" />
              {isLong ? (
                <Box flexDirection="row">
                  <Button
                    key={`${id}x`}
                    label={isOpen ? '▲ Fold' : `▼ Show all: ${all.length - CODE_FOLD} more ${lines(all.length - CODE_FOLD)}`}
                    variant="secondary"
                    onPress={() => { void update($, memberOf(opened, { requestId: `${e.requestId}:${id}` }), now => !now).catch(() => undefined) }}
                  />
                </Box>
              ) : null}
            </Box>
          )
        }
        return (
          <Box key={id} flexDirection="column" marginTop={1}>
            {/* The path copies on click. It is gray everywhere, in a question's file frame too: VS Code draws a Button
                with dimColor as gray text and any other Button filled with the theme's button color (blue), ignoring
                `plain`. Only the Open button is blue. */}
            <Button key={`${id}c`} label={item.path} plain dimColor onPress={p => copyPath(item.path, p.surface)} />
            <Box flexDirection="row">
              {item.isFolder ? (
                <Button key={`${id}r`} label={`📂 Open folder ${shortName(item.path)}`} variant={inFrame ? 'primary' : 'secondary'} onPress={() => reveal(item.path, true)} />
              ) : inEditor(item.path) ? (
                <Button key={`${id}o`} label={`📂 Open ${shortName(item.path)}`} variant={inFrame ? 'primary' : 'secondary'} onPress={() => openFile(item.path)} />
              ) : (
                <Button key={`${id}r`} label={playable(item.path) ? '🗂 Show' : `🗂 Show ${shortName(item.path)}`} variant={inFrame ? 'primary' : 'secondary'} onPress={() => reveal(item.path, false)} />
              )}
              {!item.isFolder && playable(item.path) ? (
                <Button key={`${id}p`} label={`▶ Watch ${shortName(item.path)}`} variant={inFrame ? 'primary' : 'secondary'} onPress={() => play(item.path)} />
              ) : null}
            </Box>
          </Box>
        )
      }
      for (const [j, item] of items.entries()) {
        if (item.type !== 'code') continue
        if (await read($, memberOf(copied, { requestId: `${e.requestId}:b${i}p${j}` }))) copiedIds.add(`b${i}p${j}`)
        if (await read($, memberOf(opened, { requestId: `${e.requestId}:b${i}p${j}` }))) openedIds.add(`b${i}p${j}`)
      }
      const rows = items.map((item, j) => partRow(item, `b${i}p${j}`))
      const fileFrame = (text: string, id: string) => {
        const inner = parts(text, root)
        return (
          <Box key={id} flexDirection="column" borderStyle="round" borderColor={FILE_FRAME.border} backgroundColor={FILE_FRAME.bg} paddingX={1} marginTop={1}>
            {inner.prose ? <Text color={FILE_FRAME.text} bold>{inner.prose.replace(/^[\s⠀]+/u, '').replace(/\*\*/g, '')}</Text> : null}
            {inner.parts.map((item, k) => partRow(item, `${id}p${k}`, true))}
          </Box>
        )
      }
      const formDrawn = []
      if (groupsAll) {
        const store = sentKey
        const answers = typed.get(store) ?? {}
        typed.set(store, answers)
        const numbers = isSentNow ? [] : numbered.flatMap(g => (g.n ? [g.n] : []))
        const isFrame = e.surface === 'terminal'
        const half = isFrame ? 0 : 0.5
        // The answer card: full width in the terminal; in VS Code and the app it shares a row with an empty neighbour.
        const sized = <T,>(id: string, cardBox: (size: { width?: number; flexGrow?: number; flexShrink?: number }) => T) => isFrame
          ? cardBox({})
          : (
            <Box key={`${id}row`} flexDirection="row" flexWrap="nowrap">
              {cardBox({ width: CARD.base, flexGrow: CARD.grow, flexShrink: 1 })}
              <Box key={`${id}gap`} width={0} flexGrow={CARD.spaceGrow} flexShrink={1} />
            </Box>
          )
        // A button under the field: a rounded "pill" in VS Code and the app, a plain button in the terminal.
        const pill = (key: string, label: string, onPress: (p: { surface: typeof e.surface }) => void, done = false, secondary = true) => isFrame
          ? (secondary
            ? <Button key={key} label={label} variant="secondary" onPress={onPress} />
            : <Button key={key} label={label} plain dimColor onPress={onPress} />)
          : (
            <Box key={`${key}w`} borderStyle="round" borderColor={done ? CARD.donePillBorder : CARD.pillBorder} backgroundColor={CARD.pillBg} marginRight={0.8}>
              <Button key={key} label={label} plain dimColor onPress={onPress} />
            </Box>
          )
        // What is saved and attached lives in the mod's state: a redraw keeps it, Edit opens the field again.
        const said: Record<string, string> = {}
        const attached: Record<string, string[]> = {}
        const editing: Record<string, boolean> = {}
        for (const n of numbers) {
          const key = { requestId: `${store}:${n}` }
          const was = await read($, memberOf(saved, key))
          said[n] = typeof was === 'string' ? was : ''
          const list = await read($, memberOf(files, key))
          attached[n] = Array.isArray(list) ? list.filter((f): f is string => typeof f === 'string') : []
          editing[n] = (await read($, memberOf(changing, key))) === true
          if (answers[n] === undefined && said[n]) answers[n] = said[n]
        }
        const keep = (n: string, value: string) => { answers[n] = value }
        const record = async (n: string, value: string) => {
          answers[n] = value
          const key = { requestId: `${store}:${n}` }
          await update($, memberOf(saved, key), () => value.trim()).catch(() => undefined)
          await update($, memberOf(changing, key), () => false).catch(() => undefined)
        }
        const setFiles = async (n: string, list: string[]) => {
          attached[n] = list
          await update($, memberOf(files, { requestId: `${store}:${n}` }), () => list).catch(() => undefined)
        }
        // A file added from an open field goes into that field, and the field stays open: typed text is kept,
        // ✓ or Enter saves it together with the text. Added from a green card, the card stays green.
        const addFiles = async (n: string, more: string[], keepOpen = false) => {
          const list = [...(attached[n] ?? [])]
          for (const path of more) if (!list.some(p => samePath(p, path))) list.push(path)
          if (keepOpen) await update($, memberOf(changing, { requestId: `${store}:${n}` }), () => true).catch(() => undefined)
          await setFiles(n, list)
        }
        const pickFiles = async (n: string, keepOpen = false) => {
          if (!isWindows) {
            // Mac: the system "Choose files" window through scripts/pick.applescript; Cancel gives exit code 1.
            const done = await $.process.run(['osascript', script('pick.applescript'), `File for the answer to ${n}`, root], { timeoutMs: 600000 }).catch(() => null)
            const got = done && done.exitCode === 0 ? pathsOf(done.stdout) : []
            if (got.length) await addFiles(n, got, keepOpen)
            else if (!done || (done.exitCode !== 0 && done.exitCode !== 1 && !/-128/.test(done.stderr ?? ''))) {
              try { $.ui.toast('📎 The file window did not open: write the path into the answer') } catch {}
            }
            return
          }
          const done = await $.process.run(
            ['powershell.exe', '-NoProfile', '-NonInteractive', '-Sta', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', script('pick.ps1')],
            { env: { BLOCKS_DIR: native(root), BLOCKS_TITLE: `File for the answer to ${n}` }, timeoutMs: 600000 },
          ).catch(() => null)
          const got = done && done.exitCode === 0 ? pathsOf(done.stdout) : []
          if (got.length) await addFiles(n, got, keepOpen)
          else if (!done || done.exitCode > 1) { try { $.ui.toast('📎 The file window did not open') } catch {} }
        }
        const pasteFiles = async (n: string, keepOpen = false) => {
          if (!isWindows) {
            // Mac: scripts/paste.applescript gives a file copied in Finder, or saves a screenshot to `shot`, or gives the
            // clipboard text; the mod keeps only paths of files that exist. Screenshots go where paste.ps1 puts them.
            const base = root.replace(/\/+$/u, '')
            const dir = (await $.fs.exists(`${base}/08_AGENTS`).catch(() => false)) ? `${base}/08_AGENTS/answer-files` : `${base}/.claude/answer-files`
            const now = new Date()
            const two = (x: number) => String(x).padStart(2, '0')
            const stamp = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}_${two(now.getHours())}${two(now.getMinutes())}${two(now.getSeconds())}`
            const shot = `${dir}/${stamp}_q${/^[\w-]{1,20}$/u.test(n) ? n : 'answer'}.png`
            await $.process.run(['mkdir', '-p', dir]).catch(() => null)
            const done = await $.process.run(['osascript', script('paste.applescript'), shot]).catch(() => null)
            const got: string[] = []
            for (const path of done && done.exitCode === 0 ? pathsOf(done.stdout) : []) {
              if (await $.fs.exists(path).catch(() => false)) got.push(path)
            }
            if (got.length) {
              await addFiles(n, got, keepOpen)
              try { $.ui.toast(`📎 For the answer to ${n}: ${got.map(shortName).join(', ')}`) } catch {}
            } else {
              try { $.ui.toast('📋 No screenshot or file in the clipboard. Screenshot: Cmd+Ctrl+Shift+4; file: Cmd+C in Finder') } catch {}
            }
            return
          }
          const done = await $.process.run(
            ['powershell.exe', '-NoProfile', '-NonInteractive', '-Sta', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', script('paste.ps1')],
            { env: { BLOCKS_ROOT: native(root), BLOCKS_NAME: `q${n}` } },
          ).catch(() => null)
          const got = done && done.exitCode === 0 ? pathsOf(done.stdout) : []
          if (got.length) {
            await addFiles(n, got, keepOpen)
            try { $.ui.toast(`📎 For the answer to ${n}: ${got.map(shortName).join(', ')}`) } catch {}
          } else {
            try { $.ui.toast('📋 No screenshot or file in the clipboard. Screenshot: Win+Shift+S; file: Ctrl+C in File Explorer') } catch {}
          }
        }
        const sendAll = async (surface: typeof e.surface) => {
          const text = answerText(numbers, answers, attached)
          try {
            await $.prompt.submit({ text, asUser: true })
            await update($, memberOf(sent, { requestId: store }), () => true)
          } catch {
            copy(text, surface)
            try { $.ui.toast('📋 Sending did not work: the answers are copied, paste them with Ctrl+V and press Enter') } catch {}
          }
        }
        const toBox = async (surface: typeof e.surface) => {
          const text = answerText(numbers, answers, attached)
          const box = await $.prompt.read().catch(() => ({ text: '', cursor: 0 }))
          const done = await $.prompt
            .fill({ text: box.text.trim() ? `\n${text}` : text, mode: box.text.trim() ? 'append' : 'replace' })
            .catch(() => ({ isFilled: false }))
          if (done.isFilled) return
          copy(text, surface)
          try { $.ui.toast('📋 The input box did not take the text: the answers are copied, paste them with Ctrl+V') } catch {}
        }
        // Rows of attached files: the name opens the file, "✕" removes it from the answer (the file on disk is not touched).
        const fileRows = (n: string) => (attached[n] ?? []).map((path, k) => (
          <Box key={`b${i}q${n}a${k}`} flexDirection="row" marginTop={k === 0 ? half : 0}>
            <Button key={`b${i}q${n}o${k}`} plain onPress={() => (inEditor(path) ? openFile(path) : reveal(path, false))}>
              <Text color={CARD.file}>{`📎 ${shortName(path)}`}</Text>
            </Button>
            <Button key={`b${i}q${n}d${k}`} label="✕" plain dimColor onPress={() => { void setFiles(n, (attached[n] ?? []).filter(p => p !== path)) }} />
          </Box>
        ))
        // In the terminal: "File..." and "From clipboard"; in VS Code and the app the screenshot comes first, the main case.
        const fileButtons = (n: string, done = false) => isFrame
          ? [
            pill(`b${i}q${n}f`, '📎 File…', () => { void pickFiles(n) }, done),
            pill(`b${i}q${n}v`, '📋 From clipboard', () => { void pasteFiles(n) }, done),
          ]
          : [
            pill(`b${i}q${n}v`, PASTE_LABEL, () => { void pasteFiles(n, !done) }, done),
            pill(`b${i}q${n}f`, '📎 File…', () => { void pickFiles(n, !done) }, done),
          ]
        for (const [g, group] of groupsAll.entries()) {
          const id = `b${i}g${g}`
          const n = group.n
          const closed = !!n && isSentNow
          const isDone = !!n && !closed && !editing[n] && (!!said[n] || (attached[n] ?? []).length > 0)
          const groupDrawn = []
          // Inside a group it is tight: sub-items right under the question, a file half a step down; between groups,
          // a frame and an empty line.
          for (const [j, row] of group.rows.entries()) {
            const text = row.type === 'question' && isDone ? `✅ ${row.text}` : row.text
            if (row.type === 'file') { groupDrawn.push(fileFrame(row.text, `${id}r${j}`)); continue }
            const gap = !n ? (j === 0 ? 0 : 1) : groupGap(row, j)
            groupDrawn.push(closed
              ? <Box key={`${id}r${j}`} marginTop={gap}><Text color={CLOSED.text} bold={row.type === 'question'}>{flat(text)}</Text></Box>
              : <Box key={`${id}r${j}`} marginTop={gap}><Markdown text={text} /></Box>)
          }
          if (!n) {
            formDrawn.push(...groupDrawn)
            continue
          }
          if (closed) {
            formDrawn.push(
              <Box key={`${id}g`} flexDirection="column" borderStyle="round" borderColor={CLOSED.border} backgroundColor={CLOSED.bg} paddingX={1} paddingY={half} marginTop={1}>
                {groupDrawn}
                <Text key={`${id}l`} bold color={CLOSED.text}>{CLOSED_LABEL.answered}</Text>
              </Box>,
            )
            continue
          }
          if (!Input) {
            formDrawn.push(<Box key={`${id}g`} flexDirection="column" borderStyle="round" borderColor={GROUP.border} backgroundColor={GROUP.bg} paddingX={1} marginTop={1}>{groupDrawn}</Box>)
            continue
          }
          // The question's frame is the answer's frame: "N. question... Default: ..." first, then sub-items and the file,
          // then the field, its buttons and "Copy question". The field stays narrow, never the whole width.
          const copyButton = pill(`b${i}q${n}c`, `📋 Copy question ${n}`, p => {
            copy(questionText(group), p.surface)
            try { $.ui.toast(`📋 Question ${n} copied`) } catch {}
          }, false, false)
          if (isDone) {
            // A saved answer is shown in full; "Edit" opens the field with it, any time before "Send answers".
            const body = [
              <Text key={`b${i}q${n}h`} bold color={CARD.doneHead}>{`✅ Answer to ${n} saved`}</Text>,
              said[n]
                ? <Markdown key={`b${i}q${n}t`} text={said[n] ?? ''} />
                : <Text key={`b${i}q${n}t`} dimColor>no text, the answer is in the files</Text>,
              ...fileRows(n),
              <Box key={`b${i}q${n}b`} flexDirection="row" marginTop={half} rowGap={isFrame ? undefined : 0.4}>
                {pill(`b${i}q${n}e`, '✏️ Edit', () => {
                  void update($, memberOf(changing, { requestId: `${store}:${n}` }), () => true).catch(() => undefined)
                }, true)}
                {fileButtons(n, true)}
              </Box>,
            ]
            groupDrawn.push(<Box key={`${id}f`} flexDirection="column" marginTop={half}>{body}</Box>)
          } else {
            const input = (
              <Input
                key={`b${i}q${n}`}
                placeholder={isFrame ? 'empty = default · Enter saves, nothing is sent' : 'Your answer · empty = default'}
                value={answers[n] ?? ''}
                submitLabel={isFrame ? 'save' : SAVE_LABEL}
                rows={FIELD_ROWS}
                onInput={value => keep(n, value)}
                onSubmit={value => { void record(n, value) }}
              />
            )
            groupDrawn.push(sized(`${id}f`, size => (
              <Box key={`${id}f`} flexDirection="column" marginTop={half} {...size}>
                {isFrame
                  ? [
                    input,
                    ...fileRows(n),
                    <Box key={`b${i}q${n}b`} flexDirection="row" marginTop={half}>
                      {fileButtons(n)}
                      {copyButton}
                    </Box>,
                  ]
                  : [
                    // The field looks like the chat's input box: a tall rounded frame; the text and ✓ on top, the answer's
                    // files below, "Paste screenshot" and "File..." at the bottom inside. "Copy question" sits under the frame.
                    <Box key={`b${i}q${n}w`} flexDirection="column" borderStyle="round" borderColor={CARD.fieldBorder} backgroundColor={CARD.fieldBg} paddingX={0.6} paddingY={CARD.fieldPadY} minHeight={CARD.fieldRows}>
                      <Box key={`b${i}q${n}in`} flexDirection="row" alignItems="flex-start">{input}</Box>
                      {fileRows(n)}
                      <Box key={`b${i}q${n}sp`} flexGrow={1} minHeight={0.4} />
                      <Box key={`b${i}q${n}t`} flexDirection="row" alignItems="center" rowGap={0.3}>
                        {fileButtons(n)}
                      </Box>
                    </Box>,
                    <Box key={`b${i}q${n}b`} flexDirection="row" marginTop={half}>
                      {copyButton}
                    </Box>,
                  ]}
              </Box>
            )))
          }
          formDrawn.push(<Box key={`${id}g`} flexDirection="column" borderStyle="round" borderColor={isDone ? CARD.doneBorder : GROUP.border} backgroundColor={isDone ? CARD.doneBg : GROUP.bg} paddingX={1} paddingY={half} marginTop={1}>{groupDrawn}</Box>)
        }
        if (allClosed) {
          formDrawn.push(<Box key={`b${i}x`} marginTop={1}><Text bold color={CLOSED.text}>✅ Answers sent</Text></Box>)
        } else if (Input && numbers.length > 0) {
          formDrawn.push(
            <Box key={`b${i}send`} flexDirection="column" marginTop={1}>
              <Box flexDirection="row">
                <Button key={`b${i}s`} label="✅ Send answers" variant="primary" onPress={p => { void sendAll(p.surface) }} />
                <Button key={`b${i}i`} label="✏️ To the input box" variant="secondary" onPress={p => { void toBox(p.surface) }} />
              </Box>
            </Box>,
          )
        }
      }
      const askDrawn = (asked ?? []).map((row, j) => {
        if (row.type === 'text') {
          return <Box key={`b${i}a${j}`} marginTop={j === 0 ? 0 : 1}><Markdown text={row.text} /></Box>
        }
        return fileFrame(row.text, `b${i}a${j}`)
      })
      drawn.push(
        <Box
          key={`b${i}`}
          flexDirection="column"
          borderStyle={look.border ? 'round' : undefined}
          borderColor={look.border}
          backgroundColor={look.bg}
          paddingX={1}
          marginBottom={1}
        >
          {prose ? <Markdown text={prose} /> : null}
          {askDrawn}
          {formDrawn}
          {rows}
        </Box>,
      )
    }

    return <Box flexDirection="column">{drawn}</Box>
  })
}
