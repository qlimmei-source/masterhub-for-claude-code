import type { Register } from 'claude-code'

// Helpers may not start their own helpers, in any project.
// A rule in text can be missed, so this mod is the guard: a call to Agent or Workflow made from a helper
// (the call has an agentId) is refused, and the helper gets an explanation and does its part itself.
// The main chat starts helpers as usual. An error in the guard also means refusal: one extra refusal
// costs less than helpers nobody can see.

const MESSAGE =
  'Starting your own agents is not allowed: only the main chat starts agents. ' +
  'Do your part yourself. If the task should be split, say in your report how; the main chat will start the parts.'

export const register: Register = on => {
  on('tool.call', { tool: ['Agent', 'Workflow'] }, ($, e, next) =>
    e.agentId !== undefined ? { deny: MESSAGE } : next(e),
  ).catch(($, e, next) => (next.called || e.agentId === undefined ? next(e) : { deny: MESSAGE }))
}
