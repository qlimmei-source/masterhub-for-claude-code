import { expect, test } from 'claude-code/testing'

// Mac: a project root without a drive letter. "File…" and "Paste screenshot" go through osascript and the two
// .applescript files; opening uses `open` and `code -r`. These tests run on Windows too: they check what the mod asks
// the system to run, not the Mac windows themselves.

const ROOT = '/Users/demo/Work/Bakery'
const ASK = '| ⚠️ Your answer needed |\n|---|\n| **1. Header color?** Default: blue. |\n| ⠀⠀⠀⠀🖼 [Frame](02_WORK/a.png) |\n| **2. Bigger font?** Default: yes. |'
const wait = () => new Promise(r => setTimeout(r, 20))
const ok = (stdout: string) => ({ value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })

function memory(on: any, exists: (path: string) => boolean = () => false) {
  const box = new Map<string, unknown>()
  on('session.root', () => ({ value: ROOT }))
  on('state.get', (_$: unknown, e: { key: string; id?: string }) => ({ value: { value: box.get(`${e.key}|${e.id ?? ''}`), version: 1 } }))
  on('state.set', (_$: unknown, e: { key: string; id?: string; value: unknown }) => {
    box.set(`${e.key}|${e.id ?? ''}`, e.value)
    return { value: { isSet: true, version: 2 } }
  })
  // on a Windows host the engine resolves /Users/... to <drive>:\Users\...; compare as a Mac path
  on('fs.exists', (_$: unknown, e: { path: string }) => ({ value: exists(e.path.replace(/^[A-Za-z]:/u, '').replace(/\\/gu, '/')) }))
  return box
}
const mount = ($: any, id: string) =>
  $.ui.mount({ plugin: 'blocks', component: 'AssistantMessage', requestId: id, surface: 'vscode', props: { text: ASK, isFirstOfReply: true } })

test('Mac: the path in a question frame is a Mac path, gray; Open uses code -r', async ($, on) => {
  memory(on)
  const runs: string[][] = []
  on('process.run', (_$: unknown, e: { argv: string[] }) => { runs.push([...e.argv]); return ok('') })
  const ui = await mount($, 'm1')
  const path = await ui.find({ type: 'Button', key: 'b0g1r1p0c' })
  expect(path?.props.label).toBe('/Users/demo/Work/Bakery/02_WORK/a.png')
  expect(path?.props.dimColor).toBe(true)
  await ui.press({ key: 'b0g1r1p0o' })
  await wait()
  expect(runs[0]).toEqual(['code', '-r', '/Users/demo/Work/Bakery/02_WORK/a.png'])
  expect(runs.flat().join(' ')).not.toContain('powershell')
  await ui.unmount()
})

test('Mac: "File…" opens the Mac window through pick.applescript; the paths go under the answer', async ($, on) => {
  const box = memory(on)
  const runs: string[][] = []
  on('process.run', (_$: unknown, e: { argv: string[] }) => {
    runs.push([...e.argv])
    return ok('/Users/demo/Work/Bakery/02_WORK/shot 1.png\n/Users/demo/Desktop/notes.md\n')
  })
  const ui = await mount($, 'm2')
  await ui.press({ key: 'b0q2f' })
  await wait()
  expect(runs[0]?.[0]).toBe('osascript')
  expect(runs[0]?.[1]).toMatch(/scripts\/pick\.applescript$/)
  expect(runs[0]?.[3]).toBe(ROOT)
  expect(box.get('files|m2:0:2')).toEqual(['/Users/demo/Work/Bakery/02_WORK/shot 1.png', '/Users/demo/Desktop/notes.md'])
  await ui.unmount()
})

test('Mac: Cancel in the file window adds nothing and says nothing', async ($, on) => {
  const box = memory(on)
  const toasts: string[] = []
  on('ui.toast', (_$: unknown, e: { text?: string; message?: string }) => { toasts.push(String(e.text ?? e.message ?? '')); return { value: true } })
  on('process.run', () => ({ value: { exitCode: 1, stdout: '', stderr: 'execution error: User canceled. (-128)', isStdoutTruncated: false, isStderrTruncated: false } }))
  const ui = await mount($, 'm3')
  await ui.press({ key: 'b0q2f' })
  await wait()
  expect(box.get('files|m3:0:2')).toBeUndefined()
  expect(toasts.length).toBe(0)
  await ui.unmount()
})

test('Mac: "Paste screenshot" saves into 08_AGENTS/answer-files through paste.applescript; only existing files count', async ($, on) => {
  let shot = ''
  const box = memory(on, path => path === '/Users/demo/Work/Bakery/08_AGENTS' || (shot !== '' && path === shot))
  const runs: string[][] = []
  on('process.run', (_$: unknown, e: { argv: string[] }) => {
    runs.push([...e.argv])
    if (e.argv[0] === 'osascript') { shot = e.argv[2] ?? ''; return ok(`${shot}\n`) }
    return ok('')
  })
  const ui = await mount($, 'm4')
  await ui.press({ key: 'b0q2v' })
  await wait()
  expect(runs[0]).toEqual(['mkdir', '-p', '/Users/demo/Work/Bakery/08_AGENTS/answer-files'])
  expect(runs[1]?.[1]).toMatch(/scripts\/paste\.applescript$/)
  expect(shot).toMatch(/^\/Users\/demo\/Work\/Bakery\/08_AGENTS\/answer-files\/\d{4}-\d\d-\d\d_\d{6}_q2\.png$/)
  expect(box.get('files|m4:0:2')).toEqual([shot])
  await ui.unmount()
})

test('Mac: clipboard text that is not a path of an existing file adds nothing', async ($, on) => {
  const box = memory(on)
  on('process.run', (_$: unknown, e: { argv: string[] }) => ok(e.argv[0] === 'osascript' ? 'hello\n/Users/demo/missing.png\n' : ''))
  const ui = await mount($, 'm5')
  await ui.press({ key: 'b0q2v' })
  await wait()
  expect(box.get('files|m5:0:2')).toBeUndefined()
  await ui.unmount()
})
