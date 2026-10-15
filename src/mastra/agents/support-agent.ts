import { Agent } from '@mastra/core/agent'
import { supportInstructions } from '../instructions'
import { createSupportMemory } from '../memory/create-memory'
import { resolveSupportModel } from '../model/resolve-model'
import { supportTools } from '../tools/support-tools'

export const supportAgent = new Agent({
  id: 'support-agent',
  name: 'Bayt Wardi support',
  instructions: supportInstructions,
  model: () => resolveSupportModel(),
  tools: supportTools,
  memory: createSupportMemory(),
})
