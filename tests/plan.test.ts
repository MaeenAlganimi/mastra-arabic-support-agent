import { describe, expect, it } from 'vitest'
import { supportCases } from '../src/evals/dataset'
import { planTurn } from '../src/mastra/model/plan-turn'

describe('demo planner', () => {
  it.each(supportCases)('$id chooses the expected tool', (supportCase) => {
    const plan = planTurn([{ role: 'user', text: supportCase.input }])
    if (supportCase.groundTruth.tool === null) {
      expect(plan.kind).toBe('text')
      return
    }
    expect(plan).toMatchObject({ kind: 'tool', toolName: supportCase.groundTruth.tool })
  })

  it('remembers a name from earlier user text', () => {
    const plan = planTurn([
      { role: 'user', text: 'اسمي نورا' },
      { role: 'assistant', text: 'سجلت إن اسمك نورا.' },
      { role: 'user', text: 'شن اسمي؟' },
    ])
    expect(plan.kind).toBe('text')
    if (plan.kind === 'text') expect(plan.text).toContain('نورا')
  })
})
