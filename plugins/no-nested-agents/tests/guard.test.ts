import { expect, test } from 'claude-code/testing'

const SPAWN = { tool: 'Agent', description: 'check', prompt: 'find the prices' } as const

test('the main chat starts a helper', async ($, on) => {
  let ran = false
  on('tool.call', () => {
    ran = true
    return { result: 'ok' }
  })
  const result = await $.tool.call(SPAWN)
  expect(ran).toBe(true)
  expect(result.deny).toBe(undefined)
})

test('a helper cannot start its own helper', async ($, on) => {
  let ran = false
  on('tool.call', () => {
    ran = true
    return { result: 'ok' }
  })
  const result = await $.tool.call({ ...SPAWN, agentId: 'a39392693222a64ad' })
  expect(ran).toBe(false)
  expect(result.deny).toContain('only the main chat starts agents')
})
