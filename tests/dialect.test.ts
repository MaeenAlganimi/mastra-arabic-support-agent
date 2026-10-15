import { describe, expect, it } from 'vitest'
import { detectLanguage } from '../src/mastra/dialect/detect'

describe('dialect detection', () => {
  it.each([
    ['أود معرفة حالة الطلب', 'msa'],
    ['باهي شن صار في الطلب توا؟', 'libyan'],
    ['التوصيل بياخد قد إيه؟', 'egyptian'],
    ['أبغى أتابع الطلب الحين', 'gulf'],
    ['بدي أعرف وين صار الطلب', 'levantine'],
    ["What's the status of my order?", 'english'],
    ['bahi shen sar el talab', 'libyan'],
  ] as const)('classifies %s as %s', (text, dialect) => {
    expect(detectLanguage(text).dialect).toBe(dialect)
  })
})
