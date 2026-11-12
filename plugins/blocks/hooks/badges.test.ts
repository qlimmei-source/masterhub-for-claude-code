import { expect, test } from 'claude-code/testing'
import { LOOK, split } from './register'

// 🎙 interview questions and ☢️ weighty questions have their own colors.

test('a block with 🎙 is an interview badge, not ordinary text', () => {
  expect(split('🎙 1. How do you usually start your working day?')[0]?.kind).toBe('interview')
  expect(split('- 🎙 A question')[0]?.kind).toBe('interview')
  expect(split('**🎙 An interview question**')[0]?.kind).toBe('interview')
})

test('a table starting with 🎙 is an interview; an ordinary table is not', () => {
  expect(split('| 🎙 1. A question |\n|---|\n| a sub-item |')[0]?.kind).toBe('interview')
  expect(split('| a | b |\n|---|---|\n| 1 | 2 |')[0]?.kind).toBe('plain')
})

test('⚠️ beats 🎙, and neighbouring badges do not stick together', () => {
  expect(split('⚠️ 🎙 Your answer needed')[0]?.kind).toBe('ask')
  expect(split('🎙 A question\n\n🔵 The main point').map(b => b.kind)).toEqual(['interview', 'main'])
})

test('☢️ has its own muted red badge and beats ⚠️', () => {
  expect(split('☢️ **Your "yes" is needed**')[0]?.kind).toBe('consent')
  expect(split('☢ Deleting a folder')[0]?.kind).toBe('consent')
  expect(split('☢️ ⚠️ both')[0]?.kind).toBe('consent')
  expect(LOOK.consent.bg).toBe('#a33d4e')
  expect(LOOK.consent.border).toBe('#dba0a9')
  expect(split('☢️ A question\n\n🟢 Done').map(b => b.kind)).toEqual(['consent', 'done'])
})

test('the interview color is its own: frame and fill match no other badge, the fill is not faint', () => {
  const mine = LOOK.interview
  expect(mine.mark).toBe('🎙')
  for (const [kind, look] of Object.entries(LOOK)) {
    if (kind === 'interview') continue
    expect(look.border).not.toBe(mine.border)
    expect(look.bg).not.toBe(mine.bg)
  }
  expect(parseInt(mine.bg?.slice(7, 9) ?? '00', 16)).toBeGreaterThanOrEqual(0x50)
})

test('every badge the hub skill names has a color: ⚠️ ☢️ 🎙 🔴 🟡 🟢 🔵 🟠 💡 ⚙️ 🖼 🎬 📁', () => {
  const kinds = ['⚠️', '☢️', '🎙', '🔴', '🟡', '🟢', '🔵', '🟠', '💡', '⚙️', '🖼', '🎬', '📁'].map(m => split(`${m} text`)[0]?.kind)
  expect(kinds).toEqual(['ask', 'consent', 'interview', 'urgent', 'need', 'done', 'main', 'warn', 'idea', 'tech', 'image', 'video', 'link'])
})
