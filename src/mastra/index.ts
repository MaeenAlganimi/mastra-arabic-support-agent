import { Mastra } from '@mastra/core'
import { faithfulnessScorer, languageMatchScorer, toolChoiceScorer } from '../evals/scorers'
import { supportAgent } from './agents/support-agent'
import { getSupportStorage } from './storage/create-storage'

export const mastra = new Mastra({
  agents: { supportAgent },
  storage: getSupportStorage(),
  scorers: {
    languageMatchScorer,
    toolChoiceScorer,
    faithfulnessScorer,
  },
})

export async function askSupport(message: string, threadId: string, resourceId: string) {
  const agent = mastra.getAgentById('support-agent')
  return agent.generate(message, {
    maxSteps: 5,
    memory: {
      thread: threadId,
      resource: resourceId,
    },
  })
}
