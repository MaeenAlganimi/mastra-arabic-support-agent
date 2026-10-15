import { describe, expect, it } from 'vitest'
import { retrieveFaqs } from '../src/mastra/knowledge/faq-index'

describe('faq retrieval', () => {
  it('retrieves shipping notes for an Egyptian question', async () => {
    const matches = await retrieveFaqs('التوصيل بياخد قد إيه؟', 4)
    expect(matches[0]?.id).toBe('shipping')
    expect(matches.some((match) => match.language === 'ar' && match.answer.includes('2 إلى 5 أيام عمل'))).toBe(true)
  })

  it('retrieves the return window for a Libyan question', async () => {
    const matches = await retrieveFaqs('علاش نقدر نرجع الحاجة؟', 4)
    expect(matches[0]?.id).toBe('returns')
    expect(matches.some((match) => match.answer.includes('14'))).toBe(true)
  })

  it('retrieves the English shipping note', async () => {
    const matches = await retrieveFaqs('How long does shipping take?', 6)
    expect(matches.some((match) => match.id === 'shipping' && match.language === 'en')).toBe(true)
  })
})
