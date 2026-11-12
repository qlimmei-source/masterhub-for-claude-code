import { expect, test } from 'claude-code/testing'

// The path that copies on click is gray, in a question's file frame too; only the Open button is blue.
// VS Code draws a Button with dimColor as gray text with no fill, and any other Button filled with the theme's
// button color (blue); it ignores `plain`. So the path button must carry dimColor and a plain-text label.

const ROOT = 'D:\\Work\\Demo'
const ASK = '| ⚠️ Your answer needed |\n|---|\n| **1. Header color?** Default: blue. |\n| ⠀⠀⠀⠀🖼 [Frame](02_WORK/a.png) |\n| **2. Bigger font?** Default: yes. |'

test('gray path outside a frame: the path is a gray button, Open is not gray', async ($, on) => {
  on('session.root', () => ({ value: ROOT }))
  on('state.get', () => ({ value: { value: false, version: 1 } }))
  const ui = await $.ui.mount({
    plugin: 'blocks', component: 'AssistantMessage', requestId: 'g1', surface: 'vscode',
    props: { text: '🖼 Frame ready.\n```\nD:\\Work\\Demo\\02_WORK\\egg.png\n```', isFirstOfReply: true },
  })
  const path = await ui.find({ type: 'Button', key: 'b0p0c' })
  expect(path?.props.label).toBe('D:\\Work\\Demo\\02_WORK\\egg.png')
  expect(path?.props.dimColor).toBe(true)
  expect((await ui.find({ type: 'Button', key: 'b0p0o' }))?.props.dimColor).not.toBe(true)
  await ui.unmount()
})

test('gray path in the file frame of a question: gray button with a text label, Open is blue, a click copies', async ($, on) => {
  on('session.root', () => ({ value: ROOT }))
  on('state.get', () => ({ value: { value: false, version: 1 } }))
  const copied: string[] = []
  on('ui.copy', (_$, e) => { copied.push(e.text); return { value: { isCopied: true } } })
  const ui = await $.ui.mount({
    plugin: 'blocks', component: 'AssistantMessage', requestId: 'g2', surface: 'vscode',
    props: { text: ASK, isFirstOfReply: true },
  })
  // question 1 is group g1, the file row is r1, its first part p0: the path button ends in "c", Open in "o"
  const path = await ui.find({ type: 'Button', key: 'b0g1r1p0c' })
  expect(String(path?.props.label ?? '')).toMatch(/02_WORK[\\/]a\.png$/)
  expect(path?.props.dimColor).toBe(true)
  const open = await ui.find({ type: 'Button', key: 'b0g1r1p0o' })
  expect(String(open?.props.label ?? '')).toMatch(/Open a\.png/)
  expect(open?.props.dimColor).not.toBe(true)
  await ui.press({ key: 'b0g1r1p0c' })
  await new Promise(r => setTimeout(r, 20))
  expect(copied.some(t => /a\.png$/.test(t))).toBe(true)
  await ui.unmount()
})
