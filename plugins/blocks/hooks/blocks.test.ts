import { expect, test } from 'claude-code/testing'
import { FILE_FRAME, askRows, parts, split } from './register'

const ROOT = 'D:\\Work\\Demo'

test('a path in a code window under a picture becomes a line with buttons', async () => {
  const text = '🖼 Close-up is ready.\n```\nD:\\Work\\Demo\\02_WORK\\egg.png\n```'
  const [block] = split(text)
  expect(block?.kind).toBe('image')
  const got = parts(block?.text ?? '', ROOT)
  expect(got.prose).toBe('🖼 Close-up is ready.')
  expect(got.parts).toEqual([{ type: 'path', path: 'D:\\Work\\Demo\\02_WORK\\egg.png', isFolder: false }])
})

test('a link from the project root becomes a full path, its label stays in the text', async () => {
  const got = parts('📝 Prompt: [close-up v2](02_WORK/a%20b/prompt.md)', ROOT)
  expect(got.prose).toBe('📝 Prompt: **close-up v2**')
  expect(got.parts).toEqual([{ type: 'path', path: 'D:\\Work\\Demo\\02_WORK\\a b\\prompt.md', isFolder: false }])
})

test('a path ending with a slash is a folder', async () => {
  const got = parts('📁 [_archive/](02_WORK/_archive/)', ROOT)
  expect(got.parts[0]).toEqual({ type: 'path', path: 'D:\\Work\\Demo\\02_WORK\\_archive\\', isFolder: true })
})

test('a link and a code window with the same path give one line, with the path from the code window', async () => {
  const text = '📁 [Review folder](FINAL/06_review/)\n```\nD:\\Work\\Film\\FINAL\\06_review\\\n```'
  const got = parts(text, 'd:\\Work\\Film')
  expect(got.parts).toEqual([{ type: 'path', path: 'D:\\Work\\Film\\FINAL\\06_review\\', isFolder: true }])
})

test('a file link with another drive letter case and a code window give one line', async () => {
  const text = '🖼 [Video](FINAL/06_review/03_closeup.png)\n```\nD:\\Work\\Film\\FINAL\\06_review\\03_closeup.png\n```'
  const got = parts(text, 'd:\\Work\\Film')
  expect(got.parts).toEqual([{ type: 'path', path: 'D:\\Work\\Film\\FINAL\\06_review\\03_closeup.png', isFolder: false }])
})

test('two different files stay two lines', async () => {
  const text = '🖼 [A](a.png)\n```\nD:\\Work\\Demo\\a.png\n```\n🖼 [B](b.png)\n```\nD:\\Work\\Demo\\b.png\n```'
  const got = parts(text, ROOT)
  expect(got.parts.length).toBe(2)
})

test('a multi-line prompt is a code window, not a path', async () => {
  const got = parts('Prompt:\n```\nline one\nline two\n```', ROOT)
  expect(got.parts).toEqual([{ type: 'code', source: 'line one\nline two', language: '' }])
})

test('in VS Code a block with a path draws text, the path and buttons', async ($, on) => {
  on('session.root', () => ({ value: ROOT }))
  on('state.get', () => ({ value: { value: false, version: 1 } }))
  const ui = await $.ui.mount({
    plugin: 'blocks',
    component: 'AssistantMessage',
    requestId: 'm1',
    surface: 'vscode',
    props: { text: '🖼 Close-up is ready.\n```\nD:\\Work\\Demo\\02_WORK\\egg.png\n```\n\nPrompt:\n```\nline\tone\nline two\n```', isFirstOfReply: true },
  })
  expect((await ui.find({ type: 'Button', key: 'b0p0c' }))?.props.label).toBe('D:\\Work\\Demo\\02_WORK\\egg.png')
  expect(await ui.find({ type: 'Button', text: /Copy path/ })).toBeFalsy()
  expect(await ui.find({ type: 'Button', key: 'b0p0o' })).toBeTruthy()
  expect(await ui.find({ type: 'Button', key: 'b0p0r' })).toBeFalsy()
  await ui.unmount()
})

test('a folder gets Open folder, an archive gets Show, a picture gets Open', async ($, on) => {
  on('session.root', () => ({ value: ROOT }))
  on('state.get', () => ({ value: { value: false, version: 1 } }))
  const ui = await $.ui.mount({
    plugin: 'blocks',
    component: 'AssistantMessage',
    requestId: 'm2',
    surface: 'vscode',
    props: { text: '📁 Folder\n```\nD:\\Work\\Demo\\FINAL\\\n```\n\n📁 Archive\n```\nD:\\Work\\Demo\\FINAL\\a b.zip\n```', isFirstOfReply: true },
  })
  expect((await ui.find({ type: 'Button', key: 'b0p0r' }))?.props.label).toBe('📂 Open folder FINAL/')
  expect(await ui.find({ type: 'Button', key: 'b0p0o' })).toBeFalsy()
  expect((await ui.find({ type: 'Button', key: 'b0p1r' }))?.props.label).toBe('🗂 Show a b.zip')
  await ui.unmount()
})

test('a video gets Watch and Show', async ($, on) => {
  on('session.root', () => ({ value: ROOT }))
  on('state.get', () => ({ value: { value: false, version: 1 } }))
  const ui = await $.ui.mount({
    plugin: 'blocks',
    component: 'AssistantMessage',
    requestId: 'm3',
    surface: 'vscode',
    props: { text: '🎬 Video\n```\nD:\\Work\\Demo\\FINAL\\film.mp4\n```', isFirstOfReply: true },
  })
  expect((await ui.find({ type: 'Button', key: 'b0p0p' }))?.props.label).toBe('▶ Watch film.mp4')
  expect((await ui.find({ type: 'Button', key: 'b0p0r' }))?.props.label).toBe('🗂 Show')
  expect(await ui.find({ type: 'Button', key: 'b0p0o' })).toBeFalsy()
  await ui.unmount()
})

test('Open folder goes through reveal.ps1 so that the window comes to the front', async ($, on) => {
  on('session.root', () => ({ value: ROOT }))
  on('state.get', () => ({ value: { value: false, version: 1 } }))
  const calls: { argv: readonly string[]; env?: Record<string, string> }[] = []
  on('process.run', async (_$, e) => {
    calls.push({ argv: e.argv, env: e.init?.env })
    return { value: { exitCode: 0, stdout: 'front', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  const ui = await $.ui.mount({
    plugin: 'blocks',
    component: 'AssistantMessage',
    requestId: 'm4',
    surface: 'vscode',
    props: { text: '📁 Folder\n```\nD:\\Work\\Demo\\FINAL\\\n```\n\n📁 Archive\n```\nD:\\Work\\Demo\\FINAL\\a b.zip\n```', isFirstOfReply: true },
  })
  await ui.press({ key: 'b0p0r' })
  await ui.press({ key: 'b0p1r' })
  expect(calls[0]?.argv.join(' ')).toContain('scripts/reveal.ps1')
  expect(calls[0]?.env).toEqual({ BLOCKS_PATH: 'D:\\Work\\Demo\\FINAL\\', BLOCKS_SELECT: '0' })
  expect(calls[1]?.env).toEqual({ BLOCKS_PATH: 'D:\\Work\\Demo\\FINAL\\a b.zip', BLOCKS_SELECT: '1' })
  await ui.unmount()
})

test('brackets in a file name do not break the link', async () => {
  const text = '📄 [Report](docs/Sheet_1%20(3)_stamped.pdf)\n```\nD:\\Work\\Demo\\docs\\Sheet_1 (3)_stamped.pdf\n```'
  const got = parts(text, ROOT)
  expect(got.prose).toBe('📄 **Report**')
  expect(got.parts).toEqual([{ type: 'path', path: 'D:\\Work\\Demo\\docs\\Sheet_1 (3)_stamped.pdf', isFolder: false }])
})

test('a path without a slash and without an extension is a folder too', async () => {
  const got = parts('📁 Documents\n```\nD:\\Work\\Other\\docs\\stamped\n```', ROOT)
  expect(got.parts).toEqual([{ type: 'path', path: 'D:\\Work\\Other\\docs\\stamped', isFolder: true }])
  const link = parts('📁 [Documents](docs/stamped)', ROOT)
  expect(link.parts[0]).toEqual({ type: 'path', path: 'D:\\Work\\Demo\\docs\\stamped', isFolder: true })
})

test('if the editor cannot open a file, the button shows it in the file manager', async ($, on) => {
  on('session.root', () => ({ value: ROOT }))
  on('state.get', () => ({ value: { value: false, version: 1 } }))
  const calls: { argv: readonly string[]; env?: Record<string, string> }[] = []
  on('process.run', async (_$, e) => {
    calls.push({ argv: e.argv, env: e.init?.env })
    const failed = e.argv[0] === 'cmd'
    return { value: { exitCode: failed ? 1 : 0, stdout: failed ? '' : 'front', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  const ui = await $.ui.mount({
    plugin: 'blocks',
    component: 'AssistantMessage',
    requestId: 'm5',
    surface: 'vscode',
    props: { text: '🖼 Screenshot\n```\nD:\\Work\\Demo\\a.png\n```', isFirstOfReply: true },
  })
  await ui.press({ key: 'b0p0o' })
  await new Promise(r => setTimeout(r, 20))
  expect(calls[0]?.argv.join(' ')).toContain('code -r')
  expect(calls[1]?.argv.join(' ')).toContain('scripts/reveal.ps1')
  expect(calls[1]?.env).toEqual({ BLOCKS_PATH: 'D:\\Work\\Demo\\a.png', BLOCKS_SELECT: '1' })
  await ui.unmount()
})

test('a list item with a link and a code window under it give one line with buttons', async () => {
  const text = [
    '📄 **Documents:**',
    '- [Register](docs/a.pdf)',
    '```',
    'D:\\Work\\Demo\\docs\\a.pdf',
    '```',
    '- [Report, new](docs/b%20(3)_c.pdf)',
    '```',
    'D:\\Work\\Demo\\docs\\b (3)_c.pdf',
    '```',
  ].join('\n')
  const blocks = split(text)
  const all = blocks.flatMap(b => parts(b.text, 'd:\\Work\\Demo').parts)
  expect(all).toEqual([
    { type: 'path', path: 'D:\\Work\\Demo\\docs\\a.pdf', isFolder: false },
    { type: 'path', path: 'D:\\Work\\Demo\\docs\\b (3)_c.pdf', isFolder: false },
  ])
})

test('a link, a blank line and a code window also give one line', async () => {
  const text = 'See [report](docs/a.pdf)\n\n```\nD:\\Work\\Demo\\docs\\a.pdf\n```'
  const all = split(text).flatMap(b => parts(b.text, ROOT).parts)
  expect(all.length).toBe(1)
})

test('ordinary code after a link stays a separate window', async () => {
  const text = 'See [report](docs/a.pdf)\n```\nconst a = 1\n```'
  const blocks = split(text)
  expect(blocks.map(b => b.kind)).toEqual(['plain', 'code'])
})

test('a path with shell characters never goes through cmd', async ($, on) => {
  on('session.root', () => ({ value: ROOT }))
  on('state.get', () => ({ value: { value: false, version: 1 } }))
  const calls: { argv: readonly string[]; env?: Record<string, string> }[] = []
  on('process.run', async (_$, e) => {
    calls.push({ argv: e.argv, env: e.init?.env })
    return { value: { exitCode: 0, stdout: 'front', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  const ui = await $.ui.mount({
    plugin: 'blocks',
    component: 'AssistantMessage',
    requestId: 'm6',
    surface: 'vscode',
    props: { text: '🖼 Picture\n```\nD:\\Work\\a&calc.png\n```', isFirstOfReply: true },
  })
  await ui.press({ key: 'b0p0o' })
  await new Promise(r => setTimeout(r, 20))
  expect(calls.some(c => c.argv[0] === 'cmd')).toBe(false)
  expect(calls[0]?.argv.join(' ')).toContain('scripts/reveal.ps1')
  await ui.unmount()
})

test('a question table without a file row stays a table', async () => {
  expect(askRows('| ⚠️ Your answer needed |\n|---|\n| **1. A question?** |')).toBe(null)
})

test('a file in a question table gets its own row, colored by its badge', async () => {
  const rows = askRows('| ⚠️ Your answer needed |\n|---|\n| **1. A question?** |\n| ⠀⠀⠀⠀🖼 [Frame](02_WORK/a.png) |\n| 🎬 [Clip](02_WORK/a.mp4) |\n| ⠀⠀⠀⠀• item |')
  expect(rows?.map(r => r.type)).toEqual(['text', 'text', 'file', 'file', 'text'])
  expect(rows?.[0]?.text).toBe('**⚠️ Your answer needed**')
  expect(rows?.[2]).toMatchObject({ type: 'file', kind: 'image' })
  expect(rows?.[3]).toMatchObject({ type: 'file', kind: 'video' })
  const got = parts(rows?.[2]?.text ?? '', ROOT)
  expect(got.parts[0]).toMatchObject({ type: 'path', isFolder: false })
  expect(got.parts[0]?.type === 'path' && got.parts[0].path.endsWith('a.png')).toBe(true)
})

test('the file frame is solid, without transparency', () => {
  expect(FILE_FRAME.bg).toMatch(/^#[0-9a-f]{6}$/i)
})

test('a code window: Copy at the top right, "✓ copied" after a click', async ($, on) => {
  on('session.root', () => ({ value: ROOT }))
  on('state.get', () => ({ value: { value: false, version: 1 } }))
  const sets: unknown[] = []
  on('state.set', (_$, e) => { sets.push(e); return { value: { isSet: true, version: 2 } } })
  const copied: string[] = []
  on('ui.copy', (_$, e) => { copied.push(e.text); return { value: { isCopied: true } } })
  const ui = await $.ui.mount({
    plugin: 'blocks', component: 'AssistantMessage', requestId: 'c1', surface: 'vscode',
    props: { text: 'Scheme:\n```\n┌ head ┐\n│ body │\n└──────┘\n```', isFirstOfReply: true },
  })
  expect((await ui.find({ type: 'Code' }))?.props.source).toBe('┌ head ┐\n│ body │\n└──────┘')
  expect(await ui.find({ type: 'Button', text: /^📋 Copy$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Button', key: 'b1p0x' })).toBeFalsy()
  await ui.press({ key: 'b1p0k' })
  await new Promise(r => setTimeout(r, 20))
  expect(copied).toEqual(['┌ head ┐\n│ body │\n└──────┘'])
  expect(sets.length).toBeGreaterThan(0)
  await ui.unmount()
})

test('a tall code window is folded; "Show all" unfolds it; Copy takes all of it', async ($, on) => {
  on('session.root', () => ({ value: ROOT }))
  let isOpen = false
  on('state.get', (_$, e) => ({ value: { value: e.key === 'opened' ? isOpen : false, version: 1 } }))
  on('state.set', (_$, e) => { if (e.key === 'opened') isOpen = true; return { value: { isSet: true, version: 2 } } })
  const copied: string[] = []
  on('ui.copy', (_$, e) => { copied.push(e.text); return { value: { isCopied: true } } })
  const body = Array.from({ length: 30 }, (_, k) => `line ${k + 1}`).join('\n')
  const ui = await $.ui.mount({
    plugin: 'blocks', component: 'AssistantMessage', requestId: 'c2', surface: 'vscode',
    props: { text: 'Long:\n```\n' + body + '\n```', isFirstOfReply: true },
  })
  expect((await ui.find({ type: 'Code' }))?.props.source.split('\n').length).toBe(12)
  expect((await ui.find({ type: 'Button', key: 'b1p0x' }))?.props.label).toBe('▼ Show all: 18 more lines')
  await ui.press({ key: 'b1p0k' })
  await new Promise(r => setTimeout(r, 20))
  expect(copied[0]).toBe(body)
  await ui.press({ key: 'b1p0x' })
  await new Promise(r => setTimeout(r, 20))
  expect(isOpen).toBe(true)
  await ui.unmount()
})

test('a code window of 13 to 15 lines is not folded', async ($, on) => {
  on('session.root', () => ({ value: ROOT }))
  on('state.get', () => ({ value: { value: false, version: 1 } }))
  const body = Array.from({ length: 15 }, (_, k) => `s${k}`).join('\n')
  const ui = await $.ui.mount({
    plugin: 'blocks', component: 'AssistantMessage', requestId: 'c3', surface: 'vscode',
    props: { text: 'x\n```\n' + body + '\n```', isFirstOfReply: true },
  })
  expect((await ui.find({ type: 'Code' }))?.props.source).toBe(body)
  expect(await ui.find({ type: 'Button', key: 'b1p0x' })).toBeFalsy()
  await ui.unmount()
})

test('a slash command in a code window is code, not a folder', async () => {
  expect(parts('Type:\n```\n/blocks on\n```', ROOT).parts).toEqual([{ type: 'code', source: '/blocks on', language: '' }])
  expect(parts('Type:\n```\n/hub\n```', ROOT).parts).toEqual([{ type: 'code', source: '/hub', language: '' }])
})
