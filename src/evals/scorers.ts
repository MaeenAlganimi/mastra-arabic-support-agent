import { createScorer } from '@mastra/core/evals'
import { REPLY_MARKERS, type CustomerStyle } from '../mastra/dialect/detect'
import type { SupportExpectation } from './dataset'
import { readEvalOutput } from './read-output'

function expectation(groundTruth: unknown): SupportExpectation {
  return groundTruth as SupportExpectation
}

function arabicRatio(text: string): number {
  const arabic = text.match(/[\u0600-\u06FF]/g)?.length ?? 0
  const latin = text.match(/[A-Za-z]/g)?.length ?? 0
  const total = arabic + latin
  if (total === 0) return 0
  return arabic / total
}

function mentions(text: string, phrase: string): boolean {
  return text.toLowerCase().includes(phrase.toLowerCase())
}

export const languageMatchScorer = createScorer({
  id: 'language-match',
  name: 'Language match',
  description: 'Scores whether the reply uses the customer language and dialect.',
  type: 'agent',
}).generateScore(({ run }) => {
  const expected = expectation(run.groundTruth)
  const { text } = readEvalOutput(run.output)
  if (!text.trim()) return 0
  const ratio = arabicRatio(text)
  if (expected.dialect === 'english') return ratio < 0.2 ? 1 : 0
  if (ratio < 0.45) return 0
  if (expected.dialect === 'msa') {
    const leaked = Object.values(REPLY_MARKERS).flat().some((marker) => mentions(text, marker))
    return leaked ? 0 : 1
  }
  const markers = REPLY_MARKERS[expected.dialect as Exclude<CustomerStyle, 'english' | 'msa'>]
  return markers.some((marker) => mentions(text, marker)) ? 1 : 0
})

export const toolChoiceScorer = createScorer({
  id: 'tool-choice',
  name: 'Tool choice',
  description: 'Scores whether the agent called the expected support tool.',
  type: 'agent',
}).generateScore(({ run }) => {
  const expected = expectation(run.groundTruth)
  const { tools } = readEvalOutput(run.output)
  if (expected.tool === null) return tools.length === 0 ? 1 : 0
  return tools.includes(expected.tool) ? 1 : 0
})

export const faithfulnessScorer = createScorer({
  id: 'answer-faithfulness',
  name: 'Answer faithfulness',
  description: 'Scores whether the reply keeps the tool facts and leaves invented ids out.',
  type: 'agent',
}).generateScore(({ run }) => {
  const expected = expectation(run.groundTruth)
  const { text } = readEvalOutput(run.output)
  if (!text.trim()) return 0
  const mentioned = expected.mustMention.every((phrase) => mentions(text, phrase))
  const clean = expected.mustNotMention.every((phrase) => !mentions(text, phrase))
  return mentioned && clean ? 1 : 0
})
