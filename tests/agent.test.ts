import { describe, expect, it } from 'vitest'
import { askSupport } from '../src/mastra'

function thread(): string {
  return `thread-${crypto.randomUUID()}`
}

describe('support agent', () => {
  it('answers an Egyptian order question from the sample order', async () => {
    const result = await askSupport('عايز أعرف الأوردر WRD-09831 وصل ولا لسه؟', thread(), 'customer-fahd')
    expect(result.text).toContain('WRD-09831')
    expect(result.text).toContain('18.75')
    expect(result.text).toContain('عايز')
    expect(result.text).not.toContain('86.5')
  })

  it('answers a Libyan return question from the knowledge base', async () => {
    const result = await askSupport('علاش نقدر نرجع الحاجة؟', thread(), 'customer-salem')
    expect(result.text).toContain('14')
    expect(result.text).toContain('توا')
  })

  it('opens a human handoff in Gulf Arabic', async () => {
    const result = await askSupport('حولني على موظف الحين، أبي أكلم أحد', thread(), 'customer-fahd')
    expect(result.text).toContain('TKT-')
    expect(result.text).toContain('موظف')
    expect(result.text).toContain('الحين')
  })

  it('remembers a name on the same LibSQL thread', async () => {
    const id = thread()
    await askSupport('اسمي نورا', id, 'customer-noura')
    const followUp = await askSupport('شن اسمي؟', id, 'customer-noura')
    expect(followUp.text).toContain('نورا')
  })
})
