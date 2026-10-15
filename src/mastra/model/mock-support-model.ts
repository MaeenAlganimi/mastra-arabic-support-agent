import type { MastraModelConfig } from '@mastra/core/llm'
import { planTurn, type PlannedMessage } from './plan-turn'

type PromptPart = {
  type?: string
  text?: string
  toolName?: string
  output?: unknown
}

type PromptMessage = {
  role: string
  content: string | PromptPart[]
}

type GenerateResult = {
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'tool-call'; toolCallId: string; toolName: string; input: string }
  >
  finishReason: { unified: 'stop' | 'tool-calls'; raw: string }
  usage: {
    inputTokens: { total: number; noCache: number; cacheRead: undefined; cacheWrite: undefined }
    outputTokens: { total: number; text: number; reasoning: undefined }
  }
  warnings: []
}

const usage = (): GenerateResult['usage'] => ({
  inputTokens: { total: 12, noCache: 12, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 24, text: 24, reasoning: undefined },
})

function textOf(content: string | PromptPart[]): string {
  if (typeof content === 'string') return content
  return content
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text ?? '')
    .join('\n')
}

function readPrompt(prompt: PromptMessage[]): PlannedMessage[] {
  const messages: PlannedMessage[] = []
  for (const message of prompt) {
    if (message.role === 'system') {
      messages.push({ role: 'system', text: textOf(message.content) })
      continue
    }
    if (message.role === 'user') {
      messages.push({ role: 'user', text: textOf(message.content) })
      continue
    }
    if (message.role === 'assistant') {
      const text = textOf(message.content)
      if (text) messages.push({ role: 'assistant', text })
      if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part.type === 'tool-call' && part.toolName) {
            messages.push({ role: 'assistant', text: '', toolName: part.toolName })
          }
          if (part.type === 'tool-result' && part.toolName) {
            messages.push({ role: 'tool', text: '', toolName: part.toolName, toolResult: part.output })
          }
        }
      }
      continue
    }
    if (!Array.isArray(message.content)) continue
    for (const part of message.content) {
      if (part.type !== 'tool-result' || !part.toolName) continue
      messages.push({ role: 'tool', text: '', toolName: part.toolName, toolResult: part.output })
    }
  }
  return messages
}

function generateResult(prompt: PromptMessage[]): GenerateResult {
  const plan = planTurn(readPrompt(prompt))
  if (plan.kind === 'tool') {
    return {
      content: [
        {
          type: 'tool-call',
          toolCallId: `call_${plan.toolName}_1`,
          toolName: plan.toolName,
          input: JSON.stringify(plan.input),
        },
      ],
      finishReason: { unified: 'tool-calls', raw: 'tool-calls' },
      usage: usage(),
      warnings: [],
    }
  }
  return {
    content: [{ type: 'text', text: plan.text }],
    finishReason: { unified: 'stop', raw: 'stop' },
    usage: usage(),
    warnings: [],
  }
}

function streamFrom(result: GenerateResult): ReadableStream<unknown> {
  const parts: unknown[] = [
    { type: 'stream-start', warnings: [] },
    { type: 'response-metadata', id: 'wardi-mock', modelId: 'wardi-support-mock', timestamp: new Date(0) },
  ]
  for (const content of result.content) {
    if (content.type === 'text') {
      parts.push({ type: 'text-start', id: 'text-1' }, { type: 'text-delta', id: 'text-1', delta: content.text }, { type: 'text-end', id: 'text-1' })
    } else {
      parts.push(content)
    }
  }
  parts.push({ type: 'finish', usage: result.usage, finishReason: result.finishReason })
  return new ReadableStream({
    start(controller) {
      for (const part of parts) controller.enqueue(part)
      controller.close()
    },
  })
}

/** Offline model. Same tool policy on every run, with no provider key. */
export function createSupportMockModel(): MastraModelConfig {
  return {
    specificationVersion: 'v4',
    provider: 'demo',
    modelId: 'wardi-support-mock',
    supportedUrls: {},
    async doGenerate(options: { prompt: PromptMessage[] }) {
      return generateResult(options.prompt)
    },
    async doStream(options: { prompt: PromptMessage[] }) {
      const result = generateResult(options.prompt)
      return { stream: streamFrom(result) }
    },
  } as MastraModelConfig
}
