import { expect, test } from 'claude-code/testing'
import { CARD, CLOSED, CLOSED_LABEL, GROUP, answerText, askForm, groupGap, pathsOf, questionText } from './register'

// The answer field under each numbered question of a "⚠️ Your answer needed" table: one group per question
// (the question first, its sub-items, its file, the field and its buttons inside one frame), "Send answers" at the bottom.
// The set has no question tracker: a question closes only when its answers are sent.

const ROOT = 'D:\\Work\\Demo'

const ASK = '| ⚠️ Your answer needed |\n|---|\n| **1. Header color?** Default: blue. |\n| ⠀⠀⠀⠀• was gray → becomes blue |\n| ⠀⠀⠀⠀🖼 [Frame](02_WORK/a.png) |\n| **2. Bigger font?** Default: yes. |'

/** State memory for the tests: what the mod writes, it reads on the next draw. */
function memory(on: any, seed: Record<string, unknown> = {}) {
  const box = new Map<string, unknown>(Object.entries(seed))
  const sets: { key: string; id?: string; value: unknown }[] = []
  on('session.root', () => ({ value: ROOT }))
  on('state.get', (_$: unknown, e: { key: string; id?: string }) => ({ value: { value: box.get(`${e.key}|${e.id ?? ''}`), version: 1 } }))
  on('state.set', (_$: unknown, e: { key: string; id?: string; value: unknown }) => {
    box.set(`${e.key}|${e.id ?? ''}`, e.value)
    sets.push({ key: e.key, id: e.id, value: e.value })
    return { value: { isSet: true, version: 2 } }
  })
  return { box, sets }
}

const mount = ($: any, id: string, surface = 'vscode', text = ASK) =>
  $.ui.mount({ plugin: 'blocks', component: 'AssistantMessage', requestId: id, surface, props: { text, isFirstOfReply: true } })

type Drawn = { type?: string; props?: Record<string, unknown>; children?: unknown[] }
function keysIn(node: unknown, out: string[] = []): string[] {
  if (!node || typeof node !== 'object') return out
  const n = node as Drawn
  if (typeof n.props?.key === 'string') out.push(n.props.key)
  for (const c of n.children ?? []) keysIn(c, out)
  return out
}
function findKey(node: unknown, key: string): Drawn | undefined {
  if (!node || typeof node !== 'object') return undefined
  const n = node as Drawn
  if (n.props?.key === key) return n
  for (const c of n.children ?? []) { const f = findKey(c, key); if (f) return f }
  return undefined
}
function textOf(node: unknown): string {
  if (typeof node === 'string') return node
  if (!node || typeof node !== 'object') return ''
  const n = node as Drawn
  const own = typeof n.props?.text === 'string' ? n.props.text : typeof n.props?.label === 'string' ? n.props.label : ''
  return own + (n.children ?? []).map(textOf).join('')
}
const wait = () => new Promise(r => setTimeout(r, 20))

test('questions split into groups: the question, its sub-items and files', () => {
  const form = askForm(ASK)
  expect(form?.map(g => g.n)).toEqual([null, '1', '2'])
  expect(form?.[1]?.rows.map(r => r.type)).toEqual(['question', 'text', 'file'])
  expect(form?.[1]?.rows.map((r, j) => groupGap(r, j))).toEqual([0, 0, 0])
  expect(askForm('| ⚠️ Your answer needed |\n|---|\n| Just text |')).toBe(null)
  expect(questionText(form![1]!)).toBe('1. Header color? Default: blue.\n  • was gray → becomes blue\n  🖼 Frame (02_WORK/a.png)')
})

test('answers go as one message; an empty field is "default"', () => {
  expect(answerText(['1', '2'], { 1: 'green' })).toBe('1. green\n2. default')
  expect(answerText(['1', '2'], { 1: '  ' })).toBe('all default')
})

test('answers with files: paths under their answer, an empty text is "answer in the files"', () => {
  expect(answerText(['1', '2'], { 1: 'green' }, { 1: ['D:\\P\\shot.png'], 2: ['D:\\P\\a.md'] }))
    .toBe('1. green\n   📎 D:\\P\\shot.png\n2. answer in the files\n   📎 D:\\P\\a.md\n\nFiles for the answers are at the paths above; open them.')
  expect(answerText(['1'], {}, { 1: [] })).toBe('all default')
  expect(pathsOf('D:\\a b\\x.png\r\n\r\njunk\nC:/y.html\n')).toEqual(['D:\\a b\\x.png', 'C:/y.html'])
})

test('in VS Code every question gets a field and "Copy question", with "Send answers" at the bottom', async ($, on) => {
  const { sets } = memory(on)
  const submitted: { text: string; origin: unknown }[] = []
  on('prompt.submit', (_$, e) => { submitted.push({ text: e.text, origin: e.origin }); return { text: e.text } })
  const copied: string[] = []
  on('ui.copy', (_$, e) => { copied.push(e.text); return { value: { isCopied: true } } })
  const ui = await mount($, 'q1')
  expect(await ui.find({ type: 'Input', key: 'b0q1' })).toBeTruthy()
  expect(await ui.find({ type: 'Input', key: 'b0q2' })).toBeTruthy()
  // the file in the question is still a frame with a button
  expect(await ui.find({ type: 'Button', text: /Open a\.png/ })).toBeTruthy()
  await ui.input({ key: 'b0q1', text: 'green', kind: 'change' })
  await ui.press({ key: 'b0q2c' })
  await ui.press({ key: 'b0s' })
  await wait()
  expect(copied[0]).toBe('2. Bigger font? Default: yes.')
  expect(submitted[0]?.text).toBe('1. green\n2. default')
  expect(JSON.stringify(submitted[0]?.origin)).toContain('"asUser":true')
  expect(sets.filter(s => s.key === 'sent').length).toBe(1)
  await ui.unmount()
})

test('"To the input box": the box did not take the text, so the answers are copied', async ($, on) => {
  memory(on)
  on('prompt.fill', () => ({ isFilled: false }))
  const copied: string[] = []
  on('ui.copy', (_$, e) => { copied.push(e.text); return { value: { isCopied: true } } })
  const ui = await mount($, 'q2')
  await ui.press({ key: 'b0i' })
  await wait()
  expect(copied[0]).toBe('all default')
  await ui.unmount()
})

test('the phone app has no fields: groups are frames, no "Send answers"', async ($, on) => {
  memory(on)
  const ui = await mount($, 'q3', 'mobile')
  expect(await ui.find({ type: 'Input', key: 'b0q1' })).toBeFalsy()
  expect(await ui.find({ type: 'Button', key: 'b0s' })).toBeFalsy()
  expect((await ui.find({ type: 'Box', key: 'b0g1g' }))?.props.borderColor).toBe(GROUP.border)
  await ui.unmount()
})

test('the number and the question are the first line inside the frame of their own answer', async ($, on) => {
  memory(on)
  const ui = await mount($, 'q4')
  const tree = await ui.drawn()
  for (const [g, n] of ['1', '2'].entries()) {
    const frame = findKey(tree, `b0g${g + 1}g`)
    expect(frame?.props?.borderStyle).toBe('round')
    expect(frame?.props?.borderColor).toBe(GROUP.border)
    expect(frame?.props?.marginTop).toBe(1)
    const first = (frame?.children ?? []).find(c => c && typeof c === 'object')
    expect(textOf(first).replace(/\*\*/g, '')).toMatch(new RegExp(`^${n}\\. `, 'u'))
    const inside = keysIn(frame)
    expect(inside).toContain(`b0q${n}`)
    expect(inside).toContain(`b0q${n}c`)
    for (const other of ['1', '2'].filter(x => x !== n)) expect(inside).not.toContain(`b0q${other}`)
  }
  // the sub-item and the file of question 1 are in frame 1
  expect(keysIn(findKey(tree, 'b0g1g'))).toContain('b0g1r2')
  await ui.unmount()
})

test('Enter saves the answer and sends nothing', async ($, on) => {
  const { sets } = memory(on)
  const submitted: string[] = []
  on('prompt.submit', (_$, e) => { submitted.push(e.text); return { text: e.text } })
  const ui = await mount($, 'r1')
  expect(await ui.find({ type: 'Button', key: 'b0q1f' })).toBeTruthy()
  expect(await ui.find({ type: 'Button', key: 'b0q1v' })).toBeTruthy()
  await ui.input({ key: 'b0q1', text: 'green', kind: 'submit' })
  await wait()
  expect(submitted).toEqual([])
  expect(sets.find(s => s.key === 'saved')?.value).toBe('green')
  await ui.unmount()
})

test('a saved answer: green frame, ✅ at the question, "Edit" opens the field again', async ($, on) => {
  const { box } = memory(on, { 'saved|r2:0:1': 'green, darker' })
  const ui = await mount($, 'r2')
  expect(await ui.find({ type: 'Text', text: /✅ Answer to 1 saved/ })).toBeTruthy()
  expect(await ui.find({ type: 'Markdown', text: /^✅ \*\*1\. Header color/ })).toBeTruthy()
  expect((await ui.find({ type: 'Box', key: 'b0g1g' }))?.props.borderColor).toBe(CARD.doneBorder)
  expect(await ui.find({ type: 'Input', key: 'b0q1' })).toBeFalsy()
  expect(await ui.find({ type: 'Input', key: 'b0q2' })).toBeTruthy()
  await ui.press({ key: 'b0q1e' })
  await wait()
  expect(box.get('changing|r2:0:1')).toBe(true)
  await ui.unmount()
})

test('in edit mode the field is back and holds the saved answer', async ($, on) => {
  memory(on, { 'saved|r3:0:1': 'green', 'changing|r3:0:1': true })
  const ui = await mount($, 'r3')
  expect((await ui.find({ type: 'Input', key: 'b0q1' }))?.props.value).toBe('green')
  await ui.unmount()
})

test('"File..." opens the picker through pick.ps1; the path goes under the answer and into the message', async ($, on) => {
  const { box } = memory(on)
  const calls: { argv: readonly string[]; env?: Record<string, string>; timeoutMs?: number }[] = []
  on('process.run', async (_$, e) => {
    calls.push({ argv: e.argv, env: e.init?.env, timeoutMs: e.init?.timeoutMs })
    return { value: { exitCode: 0, stdout: 'D:\\Work\\Demo\\shot 1.png\r\nD:\\Work\\Demo\\notes.md\r\n', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  const submitted: string[] = []
  on('prompt.submit', (_$, e) => { submitted.push(e.text); return { text: e.text } })
  const ui = await mount($, 'r4')
  await ui.press({ key: 'b0q2f' })
  await wait()
  expect(calls[0]?.argv.join(' ')).toContain('scripts/pick.ps1')
  expect(calls[0]?.argv).toContain('-Sta')
  expect(calls[0]?.env?.BLOCKS_DIR).toBe(ROOT)
  expect(calls[0]?.timeoutMs).toBe(600000)
  expect(box.get('files|r4:0:2')).toEqual(['D:\\Work\\Demo\\shot 1.png', 'D:\\Work\\Demo\\notes.md'])
  await ui.press({ key: 'b0s' })
  await wait()
  expect(submitted[0]).toBe('1. default\n2. answer in the files\n   📎 D:\\Work\\Demo\\shot 1.png\n   📎 D:\\Work\\Demo\\notes.md\n\nFiles for the answers are at the paths above; open them.')
  await ui.unmount()
})

test('an attached file: a row with its name and "✕"; "✕" removes it from the answer', async ($, on) => {
  const { box } = memory(on, { 'files|r5:0:1': ['D:\\P\\a.png', 'D:\\P\\b.md'] })
  const ui = await mount($, 'r5')
  // a file without text is an answer too: the card is green
  expect(await ui.find({ type: 'Text', text: /✅ Answer to 1 saved/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /📎 a\.png/ })).toBeTruthy()
  await ui.press({ key: 'b0q1d0' })
  await wait()
  expect(box.get('files|r5:0:1')).toEqual(['D:\\P\\b.md'])
  await ui.unmount()
})

test('"Paste screenshot": paste.ps1 saves it into the project; an empty clipboard adds nothing', async ($, on) => {
  const { box } = memory(on)
  const envs: (Record<string, string> | undefined)[] = []
  let answer = { exitCode: 0, stdout: 'D:\\Work\\Demo\\08_AGENTS\\answer-files\\2026-11-12_171000_q1.png\r\n' }
  on('process.run', async (_$, e) => {
    envs.push(e.init?.env)
    return { value: { ...answer, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  const ui = await mount($, 'r6')
  await ui.press({ key: 'b0q1v' })
  await wait()
  expect(envs[0]).toEqual({ BLOCKS_ROOT: ROOT, BLOCKS_NAME: 'q1' })
  expect(box.get('files|r6:0:1')).toEqual(['D:\\Work\\Demo\\08_AGENTS\\answer-files\\2026-11-12_171000_q1.png'])
  // pasted from an open field, the field stays open
  expect(box.get('changing|r6:0:1')).toBe(true)
  answer = { exitCode: 2, stdout: '' }
  await ui.press({ key: 'b0q2v' })
  await wait()
  expect(box.get('files|r6:0:2')).toBe(undefined)
  await ui.unmount()
})

test('VS Code: a tall rounded field, ✓ inside, "Paste screenshot" first, pills, a card narrower than the badge', async ($, on) => {
  memory(on)
  const ui = await mount($, 'r8')
  expect((await ui.find({ type: 'Input', key: 'b0q2' }))?.props.submitLabel).toBe('✓')
  expect((await ui.find({ type: 'Input', key: 'b0q2' }))?.props.rows).toBe(3)
  const tree = await ui.drawn()
  const field = findKey(tree, 'b0q2w')
  expect(field?.props?.borderStyle).toBe('round')
  expect(field?.props?.minHeight as number).toBeGreaterThanOrEqual(3)
  const inside = keysIn(field)
  for (const k of ['b0q2', 'b0q2v', 'b0q2f']) expect(inside).toContain(k)
  expect(inside).not.toContain('b0q2c')
  expect(inside.indexOf('b0q2v')).toBeLessThan(inside.indexOf('b0q2f'))
  expect((await ui.find({ type: 'Button', key: 'b0q2v' }))?.props.label).toBe('🖼 Paste screenshot')
  for (const k of ['b0q2fw', 'b0q2vw', 'b0q2cw']) expect((await ui.find({ type: 'Box', key: k }))?.props.borderStyle).toBe('round')
  const card = await ui.find({ type: 'Box', key: 'b0g2f' })
  expect(card?.props.width).toBe(56)
  expect(card?.props.flexShrink).toBe(1)
  expect((await ui.find({ type: 'Box', key: 'b0g2fgap' }))?.props.flexGrow).toBeGreaterThan(card?.props.flexGrow as number)
  await ui.unmount()
})

test('terminal: the field says "save", three rows, no frame around the field and no pills', async ($, on) => {
  memory(on)
  const ui = await mount($, 'r9', 'terminal')
  expect((await ui.find({ type: 'Input', key: 'b0q2' }))?.props.submitLabel).toBe('save')
  expect((await ui.find({ type: 'Input', key: 'b0q2' }))?.props.rows).toBe(3)
  expect(await ui.find({ type: 'Box', key: 'b0q2w' })).toBeFalsy()
  expect(await ui.find({ type: 'Box', key: 'b0q2fw' })).toBeFalsy()
  expect(await ui.find({ type: 'Box', key: 'b0g2frow' })).toBeFalsy()
  await ui.unmount()
})

test('answers sent: the questions turn gray, no fields, no "Send answers"', async ($, on) => {
  memory(on, { 'sent|s1:0': true })
  const ui = await mount($, 's1')
  expect(await ui.find({ type: 'Input', key: 'b0q1' })).toBeFalsy()
  expect(await ui.find({ type: 'Button', key: 'b0s' })).toBeFalsy()
  expect((await ui.find({ type: 'Box', key: 'b0g1g' }))?.props.borderColor).toBe(CLOSED.border)
  expect(await ui.find({ type: 'Text', text: CLOSED_LABEL.answered })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: '✅ Answers sent' })).toBeTruthy()
  await ui.unmount()
})

test('no question tracker is needed: the mod reads no project file and starts no program while drawing', async ($, on) => {
  memory(on)
  const touched: string[] = []
  on('fs.read', (_$: unknown, e: { path: string }) => { touched.push(e.path); return { deny: 'ENOENT' } })
  on('fs.stat', (_$: unknown, e: { path: string }) => { touched.push(e.path); return { deny: 'ENOENT' } })
  on('fs.exists', (_$: unknown, e: { path: string }) => { touched.push(e.path); return { value: false } })
  const runs: string[][] = []
  on('process.run', (_$: unknown, e: { argv: string[] }) => { runs.push(e.argv); return { deny: 'no' } })
  const ui = await mount($, 's2')
  expect(await ui.find({ type: 'Input', key: 'b0q1' })).toBeTruthy()
  expect(touched).toEqual([])
  expect(runs).toEqual([])
  await ui.unmount()
})

test('a hidden marker <!-- q:Q-0012 --> in a question row is not shown', () => {
  const form = askForm('| ⚠️ Your answer needed |\n|---|\n| 2. Voice the trial clip? Default: yes <!-- q:Q-0012 --> |')
  expect(form?.[1]?.rows[0]?.text.includes('Q-0012')).toBe(false)
})
