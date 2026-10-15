import { describe, expect, it } from 'vitest'
import { runEvals } from '@mastra/core/evals'
import { mastra } from '../src/mastra'
import { supportCases } from '../src/evals/dataset'
import { faithfulnessScorer, languageMatchScorer, toolChoiceScorer } from '../src/evals/scorers'

describe('arabic support evals', () => {
  it('scores language, tool choice, and faithfulness on dialect cases', async () => {
    const agent = mastra.getAgentById('support-agent')
    const result = await runEvals({
      target: agent,
      data: supportCases.map((supportCase) => ({
        input: supportCase.input,
        groundTruth: supportCase.groundTruth,
      })),
      scorers: [languageMatchScorer, toolChoiceScorer, faithfulnessScorer],
      targetOptions: { maxSteps: 5 },
      concurrency: 1,
    })

    expect(result.summary.totalItems).toBe(supportCases.length)
    expect(result.scores['language-match']).toBe(1)
    expect(result.scores['tool-choice']).toBe(1)
    expect(result.scores['answer-faithfulness']).toBe(1)
  })
})
