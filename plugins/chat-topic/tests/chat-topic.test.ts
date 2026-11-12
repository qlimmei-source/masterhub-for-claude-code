import { expect, mock, test } from 'claude-code/testing'
import type { On, PromptOrigin, RenderSurface, SessionMessage } from 'claude-code'

const SURFACES = ['terminal', 'vscode'] as const satisfies readonly RenderSurface[]
const PERSON: PromptOrigin = { kind: 'composer' }
const PRESENTATION = { isFullscreen: false, columns: 120 }

type Setup = {
  id?: string
  messages?: SessionMessage[]
  store?: Record<string, unknown>
  /** Project files by full path: CLAUDE.md with the hub name. */
  files?: Record<string, string>
  /** Time on the clock, ms since 1970. */
  now?: number
}

/** What the engine would answer beneath the plugin, recorded for the checks. */
function world(on: On, setup: Setup = {}) {
  const statuses: (string | undefined)[] = []
  const saved: { key: string; value: unknown }[] = []
  // Beside mock.store's own store.set hook: a second one needs a matcher.
  on('store.set', { key: /^topic:/ }, ($, e, next) => {
    saved.push({ key: e.key, value: e.value })
    return next(e)
  })
  mock.store(on, setup.store)
  const clock = mock.clock(on, { now: setup.now ?? 0 })
  on('session.id', () => ({ value: setup.id ?? 'session-1' }))
  on('session.messages', () => ({ value: setup.messages ?? [] }))
  on('ui.status', ($, e) => {
    statuses.push(e.text)
    return { value: undefined }
  })
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('prompt.submit', ($, e) => ({ text: e.text }))
  on('command.run', ($, e) => ({ text: `ran /${e.command}` }))
  on('session.end', ($, e) => ({ sessionId: e.sessionId }))
  on('fs.read', ($, e) => {
    // The engine gives the path in the form of its system, so compare ignoring slash direction.
    const same = (path: string) => path.replace(/\\/gu, '/')
    const text = Object.entries(setup.files ?? {}).find(([path]) => same(path) === same(e.path))?.[1]
    return text === undefined ? { deny: 'missing' } : { value: text }
  })
  on('classic.UserPromptSubmit', () => ({}))
  return { statuses, saved, clock, last: () => statuses.at(-1) }
}

/** What VS Code puts before the message when a file is open in the editor. */
const OPENED =
  '<ide_opened_file>The user opened the file d:\\Work\\GAMMA\\HANDOFF\\2026-10-30_1700_masterhub.md in the IDE. This may or may not be related to the current task.</ide_opened_file>'

function user(text: string): SessionMessage {
  return { role: 'user', text, toolUses: [] }
}

for (const surface of SURFACES) {
  const start = { cwd: 'C:/work', surface, isInteractive: true }

  test(`${surface}: 'Chat: Creative.' pins ▍ CREATIVE`, async ($, on) => {
    const w = world(on)
    await $.session.start(start)
    expect(w.statuses).toEqual([])

    const text = 'Chat: Creative.\nMake three banner options.'
    const result = await $.prompt.submit({ text, wait: false, origin: PERSON })

    expect(result.text).toBe(text)
    expect(w.last()).toBe('▍ CREATIVE')
    expect(w.saved).toContainEqual({ key: 'topic:session-1', value: 'Creative' })
  })


  test(`${surface}: 'Chat: MasterHub' and /hub pin the hub`, async ($, on) => {
    const w = world(on)
    await $.session.start(start)

    await $.prompt.submit({ text: 'Chat: Prices.', wait: false, origin: PERSON })
    expect(w.last()).toBe('▍ PRICES')
    await $.prompt.submit({ text: 'Chat: MasterHub', wait: false, origin: PERSON })
    expect(w.last()).toBe('▍ MasterHub')

    await $.command.run({ command: 'topic', args: 'Report', origin: PERSON, presentation: PRESENTATION })
    expect(w.last()).toBe('▍ REPORT')
    const ran = await $.command.run({
      command: 'hub',
      args: '',
      origin: PERSON,
      presentation: PRESENTATION,
    })
    expect(ran.text).toBe('ran /hub')
    expect(w.last()).toBe('▍ MasterHub')
  })

  test(`${surface}: /topic Prices changes the topic, /topic shows it`, async ($, on) => {
    const w = world(on)
    await $.session.start(start)
    await $.prompt.submit({ text: 'Chat: Creative.', wait: false, origin: PERSON })
    expect(w.last()).toBe('▍ CREATIVE')

    const set = await $.command.run({
      command: 'topic',
      args: 'Prices',
      origin: PERSON,
      presentation: PRESENTATION,
    })
    expect(set.text).toBe('Topic of this chat: Prices')
    expect(w.last()).toBe('▍ PRICES')
    expect(w.saved).toContainEqual({ key: 'topic:session-1', value: 'Prices' })

    const shown = await $.command.run({
      command: 'topic',
      args: '',
      origin: PERSON,
      presentation: PRESENTATION,
    })
    expect(shown.text).toBe('Topic of this chat: Prices')
  })

  test(`${surface}: a normal prompt changes nothing`, async ($, on) => {
    const w = world(on)
    await $.session.start(start)

    const plain = 'Make one more option, but shorter.'
    const first = await $.prompt.submit({ text: plain, wait: false, origin: PERSON })
    expect(first.text).toBe(plain)
    expect(w.statuses).toEqual([])
    expect(w.saved).toEqual([])

    await $.prompt.submit({ text: 'Chat: Creative.', wait: false, origin: PERSON })
    const count = w.statuses.length
    const again = await $.prompt.submit({ text: plain, wait: false, origin: PERSON })
    expect(again.text).toBe(plain)
    expect(w.statuses.length).toBe(count)
    expect(w.last()).toBe('▍ CREATIVE')
  })

  test(`${surface}: a message from another session does not retitle the chat`, async ($, on) => {
    const w = world(on)
    await $.session.start(start)
    await $.prompt.submit({ text: 'Chat: MasterHub', wait: false, origin: PERSON })

    const report = 'Chat: Creative. The banners are ready.'
    const result = await $.prompt.submit({
      text: report,
      wait: false,
      origin: { kind: 'peer-send-message' },
    })
    expect(result.text).toBe(report)
    expect(w.last()).toBe('▍ MasterHub')
  })

  test(`${surface}: a stored topic is shown when the session starts`, async ($, on) => {
    const w = world(on, { store: { 'topic:session-1': 'Report' } })
    await $.session.start(start)
    expect(w.last()).toBe('▍ REPORT')
  })

  test(`${surface}: a resumed session under a new id finds the topic in its transcript`, async ($, on) => {
    const w = world(on, {
      id: 'session-2',
      store: { 'topic:session-1': 'Program' },
      messages: [
        user('Chat: Program.\nRead HUB/program.md.'),
        { role: 'assistant', text: 'Done reading.', toolUses: [] },
        user('Chat: Creative. This is not the first topic line.'),
      ],
    })
    await $.session.start(start)
    expect(w.last()).toBe('▍ PROGRAM')
    expect(w.saved).toContainEqual({ key: 'topic:session-2', value: 'Program' })
  })


  test(`${surface}: a transcript that loads late is read again once`, async ($, on) => {
    const setup: Setup = {}
    const w = world(on, setup)
    await $.session.start(start)
    expect(w.statuses).toEqual([])

    setup.messages = [user('Chat: Review.')]
    await w.clock.advance(2000)
    expect(w.last()).toBe('▍ REVIEW')
  })

  test(`${surface}: /clear keeps the topic for the new conversation`, async ($, on) => {
    const setup: Setup = {}
    const w = world(on, setup)
    await $.session.start(start)
    await $.prompt.submit({ text: 'Chat: Creative.', wait: false, origin: PERSON })

    await $.session.end({ reason: 'clear', sessionId: 'session-1', resume: { id: 'session-1' } })
    setup.id = 'session-3'
    await $.prompt.submit({ text: 'Let us start over.', wait: false, origin: PERSON })

    expect(w.last()).toBe('▍ CREATIVE')
    expect(w.saved).toContainEqual({ key: 'topic:session-3', value: 'Creative' })
  })

  test(`${surface}: switching to an untitled conversation clears the line`, async ($, on) => {
    const setup: Setup = {}
    const w = world(on, setup)
    await $.session.start(start)
    await $.prompt.submit({ text: 'Chat: Creative.', wait: false, origin: PERSON })

    await $.session.end({ reason: 'resume', sessionId: 'session-1', resume: { id: 'session-1' } })
    expect(w.last()).toBe(undefined)

    setup.id = 'session-4'
    await $.prompt.submit({ text: 'What next?', wait: false, origin: PERSON })
    expect(w.last()).toBe(undefined)
    expect(w.saved.some(one => one.key === 'topic:session-4')).toBe(false)
  })

  test(`${surface}: /hub pins ▍ MasterHub`, async ($, on) => {
    const w = world(on)
    await $.session.start(start)
    await $.prompt.submit({ text: 'Chat: Prices.', wait: false, origin: PERSON })
    expect(w.last()).toBe('▍ PRICES')

    const ran = await $.command.run({ command: 'hub', args: '', origin: PERSON, presentation: PRESENTATION })
    expect(ran.text).toBe('ran /hub')
    expect(w.last()).toBe('▍ MasterHub')
  })

  test(`${surface}: a hub transcript with /hub is recognised`, async ($, on) => {
    const w = world(on, { messages: [user('<command-message>hub</command-message>\n<command-name>/hub</command-name>')] })
    await $.session.start(start)
    expect(w.last()).toBe('▍ MasterHub')
  })

  test(`${surface}: /hub names a new project's chat after its folder`, async ($, on) => {
    world(on)
    const result = await $.classic.UserPromptSubmit({ prompt: '/hub', source: 'user', cwd: 'D:\\Work\\NEWPROJECT' })
    expect(result.sessionTitle).toBe('MasterHub NEWPROJECT')
  })

  test(`${surface}: /hub keeps the hub name the project already uses`, async ($, on) => {
    const claude = 'Main chat: MasterHub ACME. Like in GAMMA (MasterHub GAMMA). Write to MasterHub ACME.'
    world(on, { files: { 'D:/Work/ACME_SITE/CLAUDE.md': claude } })
    const result = await $.classic.UserPromptSubmit({ prompt: '/hub hand out the edits', cwd: 'D:/Work/ACME_SITE' })
    expect(result.sessionTitle).toBe('MasterHub ACME')
  })

  test(`${surface}: /hub leaves a chat already named MasterHub and ignores other prompts`, async ($, on) => {
    world(on)
    const named = await $.classic.UserPromptSubmit({
      prompt: '/hub',
      source: 'user',
      session_title: 'MasterHub DELTA',
      cwd: 'D:/Work/DELTA',
    })
    expect(named.sessionTitle).toBe(undefined)
    const plain = await $.classic.UserPromptSubmit({ prompt: 'Run /hub later', source: 'user', cwd: 'D:/Work/DELTA' })
    expect(plain.sessionTitle).toBe(undefined)
    const relayed = await $.classic.UserPromptSubmit({ prompt: '/hub', source: 'system', cwd: 'D:/Work/DELTA' })
    expect(relayed.sessionTitle).toBe(undefined)
  })

  const ACME = 'D:/Work/ACME_SITE'
  const ACME_CLAUDE = { [`${ACME}/CLAUDE.md`]: 'Main chat: MasterHub ACME. Like in GAMMA (MasterHub GAMMA). Write to MasterHub ACME.' }
  const EVENING = new Date(2026, 9, 24, 17, 50).getTime()

  test(`${surface}: /nextchat in the hub renames it OLD MasterHub with the local date and time`, async ($, on) => {
    world(on, { files: ACME_CLAUDE, now: EVENING })
    const result = await $.classic.UserPromptSubmit({
      prompt: '/nextchat',
      source: 'user',
      session_title: 'MasterHub ACME',
      cwd: ACME,
    })
    expect(result.sessionTitle).toBe('OLD MasterHub ACME · 24.10 17:50')

    // The command itself runs as usual: the mod does not replace it.
    const ran = await $.command.run({ command: 'nextchat', args: '', origin: PERSON, presentation: PRESENTATION })
    expect(ran.text).toBe('ran /nextchat')
  })

  test(`${surface}: /nextchat just after midnight carries the new local day`, async ($, on) => {
    world(on, { now: new Date(2026, 9, 25, 1, 5).getTime() })
    const result = await $.classic.UserPromptSubmit({
      prompt: '/nextchat main chat',
      source: 'user',
      session_title: 'masterhub NEWPROJECT',
      cwd: 'D:\\Work\\NEWPROJECT',
    })
    expect(result.sessionTitle).toBe('OLD MasterHub NEWPROJECT · 25.10 01:05')
  })

  test(`${surface}: /nextchat leaves topic chats, an old hub and relayed prompts as they are`, async ($, on) => {
    world(on, { files: ACME_CLAUDE, now: EVENING })
    const topic = await $.classic.UserPromptSubmit({ prompt: '/nextchat', source: 'user', session_title: 'Creative', cwd: ACME })
    expect(topic.sessionTitle).toBe(undefined)
    const untitled = await $.classic.UserPromptSubmit({ prompt: '/nextchat', source: 'user', cwd: ACME })
    expect(untitled.sessionTitle).toBe(undefined)
    const old = await $.classic.UserPromptSubmit({
      prompt: '/nextchat',
      source: 'user',
      session_title: 'OLD MasterHub ACME · 24.10 15:10',
      cwd: ACME,
    })
    expect(old.sessionTitle).toBe(undefined)
    // A message from another session comes wrapped, so it does not start with the command.
    const relayed = await $.classic.UserPromptSubmit({
      prompt: 'Another Claude session sent a message:\n<cross-session-message from="uds:x" from-name="peer-76">\n/nextchat\n</cross-session-message>',
      source: 'system',
      session_title: 'MasterHub ACME',
      cwd: ACME,
    })
    expect(relayed.sessionTitle).toBe(undefined)
    const plain = await $.classic.UserPromptSubmit({
      prompt: 'We will run /nextchat later',
      source: 'user',
      session_title: 'MasterHub ACME',
      cwd: ACME,
    })
    expect(plain.sessionTitle).toBe(undefined)
  })

  test(`${surface}: /hub typed in an old hub names it MasterHub again`, async ($, on) => {
    world(on, { files: ACME_CLAUDE, now: EVENING })
    const result = await $.classic.UserPromptSubmit({
      prompt: '/hub',
      source: 'user',
      session_title: 'OLD MasterHub ACME · 24.10 17:50',
      cwd: ACME,
    })
    expect(result.sessionTitle).toBe('MasterHub ACME')
  })

  const GAMMA_PATH = 'd:\\Work\\GAMMA'
  const HANDOFF_AT = new Date(2026, 9, 30, 16, 32).getTime()

  test(`${surface}: a chat already named MasterHub DELTA keeps its name, /nextchat makes it OLD MasterHub DELTA`, async ($, on) => {
    world(on, { now: HANDOFF_AT })
    const kept = await $.classic.UserPromptSubmit({
      prompt: '/hub',
      source: 'user',
      session_title: 'MasterHub DELTA',
      cwd: 'D:/Work/DELTA',
    })
    expect(kept.sessionTitle).toBe(undefined)
    const old = await $.classic.UserPromptSubmit({
      prompt: '/nextchat',
      source: 'user',
      session_title: 'MasterHub DELTA',
      cwd: 'D:/Work/DELTA',
    })
    expect(old.sessionTitle).toBe('OLD MasterHub DELTA · 30.10 16:32')
  })

  test(`${surface}: 'Chat: masterhub' and 'Chat: MASTERHUB' pin the main chat as exactly MasterHub, other topics stay capitals`, async ($, on) => {
    const w = world(on)
    await $.session.start(start)
    await $.prompt.submit({ text: 'Chat: masterhub', wait: false, origin: PERSON })
    expect(w.last()).toBe('▍ MasterHub')
    await $.prompt.submit({ text: 'Chat: Prices.', wait: false, origin: PERSON })
    expect(w.last()).toBe('▍ PRICES')
    await $.prompt.submit({ text: 'Chat: MASTERHUB', wait: false, origin: PERSON })
    expect(w.last()).toBe('▍ MasterHub')
    expect(w.saved).toContainEqual({ key: 'topic:session-1', value: 'MasterHub' })
  })

  test(`${surface}: /nextchat with a file open in VS Code still makes the hub old`, async ($, on) => {
    world(on, { now: HANDOFF_AT })
    for (const prompt of [`${OPENED}\n/nextchat`, `${OPENED}/nextchat`, `/nextchat\n${OPENED}`]) {
      const result = await $.classic.UserPromptSubmit({ prompt, session_title: 'MasterHub GAMMA', cwd: GAMMA_PATH })
      expect(result.sessionTitle).toBe('OLD MasterHub GAMMA · 30.10 16:32')
    }
  })

  test(`${surface}: /hub with a file open in VS Code names the new chat`, async ($, on) => {
    world(on, { files: { 'd:/Work/GAMMA/CLAUDE.md': 'Main chat: MasterHub GAMMA.' } })
    const result = await $.classic.UserPromptSubmit({ prompt: `${OPENED}\n/hub Continue from handoff`, cwd: GAMMA_PATH })
    expect(result.sessionTitle).toBe('MasterHub GAMMA')
  })

  test(`${surface}: pasted /hub names the new chat; a pasted 'Chat:' line pins the topic`, async ($, on) => {
    // A pasted handoff used to leave the chat without a name.
    const w = world(on, { files: { 'D:/Work/DELTA/CLAUDE.md': 'Main chat: MasterHub DELTA.' } })
    const pasted = '<pasted_content id="c619">\n/hub\nContinue from handoff HANDOFF/2026-10-30_2106_masterhub.md.\n</pasted_content id="c619">'
    const named = await $.classic.UserPromptSubmit({ prompt: pasted, cwd: 'D:/Work/DELTA' })
    expect(named.sessionTitle).toBe('MasterHub DELTA')
    const again = await $.classic.UserPromptSubmit({ prompt: pasted, session_title: 'MasterHub DELTA', cwd: 'D:/Work/DELTA' })
    expect(again.sessionTitle).toBe(undefined)
    const inside = await $.classic.UserPromptSubmit({ prompt: 'Look: <pasted_content id="a1">/hub</pasted_content id="a1">', cwd: 'D:/Work/DELTA' })
    expect(inside.sessionTitle).toBe(undefined)
    await $.session.start(start)
    await $.prompt.submit({ text: '<pasted_content id="b2">\nChat: Editing.\nBuild the video.\n</pasted_content id="b2">', wait: false, origin: PERSON })
    expect(w.last()).toBe('▍ EDITING')
  })

  test(`${surface}: the command as the engine records it is recognised too`, async ($, on) => {
    world(on, { now: HANDOFF_AT })
    const old = await $.classic.UserPromptSubmit({
      prompt: '<command-message>nextchat</command-message>\n<command-name>/nextchat</command-name>',
      session_title: 'MasterHub GAMMA',
      cwd: GAMMA_PATH,
    })
    expect(old.sessionTitle).toBe('OLD MasterHub GAMMA · 30.10 16:32')
    const named = await $.classic.UserPromptSubmit({
      prompt: '<command-message>hub</command-message>\n<command-name>/hub</command-name>\n<command-args>hand out</command-args>',
      cwd: 'D:/Work/NEWPROJECT',
    })
    expect(named.sessionTitle).toBe('MasterHub NEWPROJECT')
  })

  test(`${surface}: VS Code as an SDK host names the hub; /nextchat started by a mod makes it old`, async ($, on) => {
    world(on, { now: HANDOFF_AT })
    const named = await $.classic.UserPromptSubmit({ prompt: '/hub', source: 'sdk', cwd: 'D:/Work/NEWPROJECT' })
    expect(named.sessionTitle).toBe('MasterHub NEWPROJECT')
    const woken = await $.classic.UserPromptSubmit({ prompt: '/hub', source: 'schedule_wakeup', cwd: 'D:/Work/NEWPROJECT' })
    expect(woken.sessionTitle).toBe(undefined)
    const byMod = await $.classic.UserPromptSubmit({ prompt: '/nextchat', source: 'system', session_title: 'MasterHub GAMMA', cwd: GAMMA_PATH })
    expect(byMod.sessionTitle).toBe('OLD MasterHub GAMMA · 30.10 16:32')
  })

  test(`${surface}: the old hub keeps its own project name, not a word from CLAUDE.md`, async ($, on) => {
    const claude = 'Main chat: MasterHub HUB, MasterHub HUB, MasterHub BETA_KG.'
    world(on, { files: { 'D:/Work/BETA_KG/CLAUDE.md': claude }, now: HANDOFF_AT })
    const result = await $.classic.UserPromptSubmit({
      prompt: '/nextchat',
      session_title: 'MasterHub BETA_KG',
      cwd: 'D:/Work/BETA_KG',
    })
    expect(result.sessionTitle).toBe('OLD MasterHub BETA_KG · 30.10 16:32')
    const bare = await $.classic.UserPromptSubmit({ prompt: '/nextchat', session_title: 'MasterHub', cwd: 'D:/Work/BETA_KG' })
    expect(bare.sessionTitle).toBe('OLD MasterHub HUB · 30.10 16:32')
  })

  test(`${surface}: a 'Chat:' line after a VS Code insert pins the topic`, async ($, on) => {
    const w = world(on)
    await $.session.start(start)
    await $.prompt.submit({ text: `${OPENED}\nChat: Creative.\nMake a banner.`, wait: false, origin: PERSON })
    expect(w.last()).toBe('▍ CREATIVE')
  })

  test(`${surface}: the plugin form of the commands works like the short form`, async ($, on) => {
    world(on, { now: HANDOFF_AT })
    const named = await $.classic.UserPromptSubmit({ prompt: '/masterhub:hub', source: 'user', cwd: 'D:/Work/NEWPROJECT' })
    expect(named.sessionTitle).toBe('MasterHub NEWPROJECT')
    const old = await $.classic.UserPromptSubmit({
      prompt: '<command-message>masterhub:nextchat</command-message>\n<command-name>/masterhub:nextchat</command-name>',
      session_title: 'MasterHub GAMMA',
      cwd: GAMMA_PATH,
    })
    expect(old.sessionTitle).toBe('OLD MasterHub GAMMA · 30.10 16:32')
  })

  test(`${surface}: a Russian topic line works too`, async ($, on) => {
    const w = world(on)
    await $.session.start(start)
    await $.prompt.submit({ text: 'Чат: Цены.', wait: false, origin: PERSON })
    expect(w.last()).toBe('▍ ЦЕНЫ')
  })
}
