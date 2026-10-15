import type { MastraModelConfig } from '@mastra/core/llm'
import { createSupportMockModel } from './mock-support-model'

export type ModelMode = 'mock' | 'openai' | 'google'

type Env = Record<string, string | undefined>

export function resolveModelMode(env: Env = process.env): ModelMode {
  const forced = env.SUPPORT_MODEL_MODE
  if (forced === 'mock' || forced === 'openai' || forced === 'google') return forced
  if (env.OPENAI_API_KEY) return 'openai'
  if (env.GOOGLE_GENERATIVE_AI_API_KEY || env.GOOGLE_API_KEY) return 'google'
  return 'mock'
}

export function resolveSupportModel(env: Env = process.env): MastraModelConfig {
  const mode = resolveModelMode(env)
  if (mode === 'openai') return 'openai/gpt-5.6-sol'
  if (mode === 'google') {
    if (!env.GOOGLE_API_KEY && env.GOOGLE_GENERATIVE_AI_API_KEY) {
      env.GOOGLE_API_KEY = env.GOOGLE_GENERATIVE_AI_API_KEY
    }
    return 'google/gemini-2.5-flash'
  }
  return createSupportMockModel()
}
