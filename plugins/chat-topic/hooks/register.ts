import type { EngineInterface, PromptOrigin, Register } from 'claude-code'

// The chat's topic, shown as a line under the input box ("▍ DESIGN").
// Where the topic comes from:
//   - the first line of a message, "Chat: <Topic>." (a message like this also changes it);
//   - the main chat: the command /hub or the line "Chat: MasterHub";
//   - by hand: /topic <topic>; /topic alone shows the current one.
// /hub also names the chat "MasterHub <PROJECT>" if it has no such name yet. The project name is
//   the one the project's CLAUDE.md already uses, otherwise the folder name.
// /nextchat in the main chat names the chat "OLD MasterHub <PROJECT> · DD.MM HH:MM" in local time,
//   so that the list of chats holds one "MasterHub <PROJECT>", the new one. Topic chats are left alone;
//   /hub typed later in the old chat names it "MasterHub <PROJECT>" again.
// A chat name can only be set by answering classic.UserPromptSubmit (the field sessionTitle).
// VS Code puts "<ide_opened_file>…</ide_opened_file>" before a message when a file is open, and pasted text
//   arrives wrapped in "<pasted_content id="…">…</pasted_content id="…">". Both are removed before checking.
// Commands from a plugin can be written two ways, /hub and /masterhub:hub. Both are recognised.
// The topic is kept in $.store under topic:<session id>. If there is no record (an old session, a resume
//   under a new id), it is looked up in the transcript.
// Any error is swallowed: messages and commands pass through as they are.

const KEY = 'topic:'
const HUB = 'MasterHub'
const PREFIX = '▍ '
const MAX_LENGTH = 60
const RETRY_MS = 2000

/** "Chat: Design." The name up to the full stop or the end of the line. Russian "Чат:" works too. */
const TOPIC_LINE = /^\s*(?:Chat|Чат):\s*([^.\n]+)/iu
/** The main chat command as a prompt or a transcript writes it. */
const HUB_COMMAND = /^\s*\/(?:masterhub:)?hub(?![\w-])|<command-name>\/(?:masterhub:)?hub<\/command-name>/u
/** The main chat command at the start of the user's message: this names the chat. */
const HUB_PROMPT =
  /^\s*(?:\/(?:masterhub:)?hub(?![\w-])|(?:<command-message>[^<]*<\/command-message>\s*)?<command-name>\/(?:masterhub:)?hub<\/command-name>)/u
/** /nextchat at the start of a message: the main chat moves to a new chat, this one becomes old. */
const HANDOFF_PROMPT =
  /^\s*(?:\/(?:masterhub:)?nextchat(?![\w-])|(?:<command-message>[^<]*<\/command-message>\s*)?<command-name>\/(?:masterhub:)?nextchat<\/command-name>)/u
/** Where /hub may name a chat from: the input box (user), VS Code and other hosts (sdk), or no source at all. */
const TYPED: ReadonlySet<string> = new Set(['user', 'sdk'])
/** The old main chat's name: "OLD MasterHub ACME · 24.10 17:50". */
const OLD_HUB = `OLD ${HUB}`
/** The main chat's name as CLAUDE.md already writes it: "MasterHub ACME". */
const HUB_NAME = /MasterHub ([A-Z][A-Z0-9_-]*)/gu
/** Service blocks and VS Code inserts (open file, selection): removed before checking the text. */
const INSERTED = /<(system-reminder|ide_opened_file|ide_selection)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gu
/** Marks around pasted text: only the marks are removed. */
const PASTED = /<\/?pasted_content(?:\s[^>]*)?>/gu

/** The fields of classic.UserPromptSubmit this mod reads. */
type PromptInput = { session_id: string; cwd: string; prompt: string; source?: string; session_title?: string }

/** Messages that do not come from the person: notices, other sessions, schedules, channels. They set no topic. */
const RELAYED: ReadonlySet<PromptOrigin['kind']> = new Set<PromptOrigin['kind']>([
  'task-notification',
  'scheduled-trigger',
  'peer',
  'peer-send-message',
  'projects-relay',
  'channel',
  'coordinator',
  'observer',
  'observer-activity',
])

type Pinned = { id: string; topic: string }

/** The topic shown now, and the session it belongs to. */
let current: Pinned | undefined
/** The session whose memory and transcript were already read. */
let checked: string | undefined
/** The topic that moves into a new conversation after /clear. */
let carry: string | undefined

export const register: Register = on => {
  current = undefined
  checked = undefined
  carry = undefined

  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({
        name: 'topic',
        description: 'The topic of this chat: /topic <topic> sets it, /topic shows it',
        argumentHint: '[topic]',
        immediate: true,
      })
    } catch {}
    try {
      await restore($, false)
      // A resumed conversation may finish loading a little later: one more attempt.
      if (current === undefined) {
        $.clock.after(RETRY_MS, () => {
          restore($, true).catch(() => undefined)
        })
      }
    } catch {}
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    try {
      const topic = byPerson(e.origin) ? topicIn(e.text) : undefined
      if (topic !== undefined) await pin($, await $.session.id(), topic)
    } catch {}
    const result = await next(e)
    try {
      await restore($, false)
    } catch {}
    return result
  }).catch(($, e, next) => next(e))

  on('command.run', { command: ['hub', 'masterhub:hub'] }, async ($, e, next) => {
    try {
      await pin($, await $.session.id(), HUB)
    } catch {}
    return next(e)
  }).catch(($, e, next) => next(e))

  on('classic.UserPromptSubmit', async ($, e, next) => {
    const result = await next(e)
    let title: string | undefined
    try {
      title = await titleFor($, e)
    } catch {}
    return title === undefined ? result : { ...result, sessionTitle: title }
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'topic' }, async ($, e) => {
    const id = await $.session.id()
    const asked = tidy(e.args.replace(/^\s*(?:Chat|Чат):\s*/iu, ''))
    if (asked !== undefined) {
      await pin($, id, asked)
      return { text: `Topic of this chat: ${asked}` }
    }
    await restore($, false)
    const shown = current?.id === id ? current.topic : undefined
    return shown !== undefined
      ? { text: `Topic of this chat: ${shown}` }
      : { text: 'This chat has no topic yet. Set one: /topic <topic>' }
  }).catch(() => ({ text: 'chat-topic: could not read or save the topic.' }))

  on('session.end', { reason: ['clear', 'resume'] }, ($, e, next) => {
    try {
      if (e.reason === 'clear') {
        carry = current?.topic
      } else {
        carry = undefined
        $.ui.status(undefined)
      }
      current = undefined
      checked = undefined
    } catch {}
    return next(e)
  })
}

/** Is this text the main chat's name, in any letter case: "MasterHub", "MASTERHUB", "masterhub". */
function isHubName(text: string): boolean {
  return text.toUpperCase() === HUB.toUpperCase()
}

/** Topics show in capitals; the main chat shows exactly "MasterHub", as the product is spelled. */
function show($: EngineInterface, topic: string): void {
  $.ui.status(PREFIX + (isHubName(topic) ? HUB : topic.toUpperCase()))
}

/** Shows the topic and remembers it for this session. */
async function pin($: EngineInterface, id: string, topic: string): Promise<void> {
  current = { id, topic }
  checked = id
  carry = undefined
  show($, topic)
  await $.store.set(KEY + id, topic)
}

/** Shows this session's topic: from memory, from the transcript, or the previous one after /clear. */
async function restore($: EngineInterface, rescan: boolean): Promise<void> {
  const id = await $.session.id()
  if (current?.id === id) return
  if (checked === id && !rescan) return
  checked = id
  const saved = tidy(await $.store.get(KEY + id))
  if (saved !== undefined) {
    current = { id, topic: saved }
    carry = undefined
    show($, saved)
    return
  }
  const found = (await fromTranscript($)) ?? carry
  if (found !== undefined) await pin($, id, found)
}

/** The first message of the person in the transcript that sets a topic. */
async function fromTranscript($: EngineInterface): Promise<string | undefined> {
  for (const message of await $.session.messages()) {
    if (message.role !== 'user') continue
    const topic = topicIn(message.text)
    if (topic !== undefined) return topic
  }
  return undefined
}

/** The project name for the main chat: the most frequent "MasterHub <NAME>" in CLAUDE.md, otherwise the folder. */
async function projectName($: EngineInterface, cwd: string): Promise<string> {
  const folder = cwd.split(/[\\/]/u).filter(part => part !== '').at(-1) ?? 'PROJECT'
  let text = ''
  try {
    const read = await $.fs.read(`${cwd.replace(/[\\/]+$/u, '')}/CLAUDE.md`)
    if (typeof read === 'string') text = read
  } catch {}
  const counts = new Map<string, number>()
  for (const match of text.matchAll(HUB_NAME)) {
    const name = match[1]
    if (name !== undefined) counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  let best: string | undefined
  for (const [name, count] of counts) if (best === undefined || count > (counts.get(best) ?? 0)) best = name
  return best ?? folder.toUpperCase()
}

/**
 * The name this message sets: /hub gives "MasterHub <PROJECT>", /nextchat in the main chat gives
 * "OLD MasterHub <PROJECT> · DD.MM HH:MM"; undefined leaves the name alone.
 */
async function titleFor($: EngineInterface, e: PromptInput): Promise<string | undefined> {
  const text = bare(e.prompt)
  const title = e.session_title?.trim()
  const isHub = title !== undefined && title.toUpperCase().startsWith(HUB.toUpperCase())
  if (HUB_PROMPT.test(text)) {
    if (isHub || (e.source !== undefined && !TYPED.has(e.source))) return undefined
    return `${HUB} ${await projectName($, e.cwd)}`
  }
  if (HANDOFF_PROMPT.test(text) && isHub && title !== undefined) {
    const project = title.slice(HUB.length).replace(/^[\s·:—–-]+/u, '').trim() || (await projectName($, e.cwd))
    return `${OLD_HUB} ${project} · ${stamp(await $.clock.now())}`
  }
  return undefined
}

/** The text of a message without service blocks, editor inserts and paste marks. */
function bare(text: string): string {
  return text.replace(INSERTED, '').replace(PASTED, '')
}

/** "24.10 17:50": day, month and time on this computer's clock. */
function stamp(ms: number): string {
  const local = new Date(ms)
  const two = (n: number) => String(n).padStart(2, '0')
  return `${two(local.getDate())}.${two(local.getMonth() + 1)} ${two(local.getHours())}:${two(local.getMinutes())}`
}

function byPerson(origin: PromptOrigin): boolean {
  if (origin.kind === 'plugin') return origin.asUser === true
  return !RELAYED.has(origin.kind)
}

/** The topic from a message's text, or undefined if the message sets none. */
function topicIn(text: string): string | undefined {
  const clean = bare(text)
  const named = tidy(TOPIC_LINE.exec(clean)?.[1])
  if (named !== undefined) return isHubName(named) ? HUB : named
  if (HUB_COMMAND.test(clean)) return HUB
  return undefined
}

function tidy(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const name = raw
    .replace(/[*_`"«»]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim()
    .replace(/[.,;:!?]+$/u, '')
    .trim()
  return name === '' ? undefined : name.slice(0, MAX_LENGTH)
}
