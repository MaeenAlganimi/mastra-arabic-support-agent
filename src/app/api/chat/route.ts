import { mastra, askSupport } from '@/mastra'
import { detectLanguage } from '@/mastra/dialect/detect'
import { resolveModelMode } from '@/mastra/model/resolve-model'

export const dynamic = 'force-dynamic'

const TOOLS = ['lookupOrder', 'searchFaq', 'createTicket', 'requestHumanHandoff'] as const
const RESOURCE_ID = 'demo-customer'

function sanitizeId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  return /^[A-Za-z0-9_-]{1,80}$/.test(value) ? value : null
}

function toolNames(result: unknown): string[] {
  const blob = JSON.stringify(result)
  return TOOLS.filter((name) => blob.includes(`"toolName":"${name}"`) || blob.includes(`"toolName": "${name}"`))
}

function textFromMessage(message: unknown): { role: 'user' | 'assistant'; text: string } | null {
  if (!message || typeof message !== 'object') return null
  const record = message as {
    role?: string
    content?: { parts?: Array<{ type?: string; text?: string }> }
  }
  if (record.role !== 'user' && record.role !== 'assistant') return null
  const text = (record.content?.parts ?? [])
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n')
    .trim()
  if (!text) return null
  return { role: record.role, text }
}

export async function GET(request: Request) {
  const threadId = sanitizeId(new URL(request.url).searchParams.get('threadId'))
  const mode = resolveModelMode()
  if (!threadId) return Response.json({ mode, messages: [] })

  try {
    const memory = await mastra.getAgentById('support-agent').getMemory()
    const recalled = await memory?.recall({ threadId, resourceId: RESOURCE_ID })
    const messages = (recalled?.messages ?? [])
      .map(textFromMessage)
      .filter((message): message is { role: 'user' | 'assistant'; text: string } => Boolean(message))
    return Response.json({ mode, messages })
  } catch {
    return Response.json({ mode, messages: [] })
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as { message?: unknown; threadId?: unknown }
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) {
    return Response.json({ error: 'Message is required.' }, { status: 400 })
  }
  if (message.length > 2000) {
    return Response.json({ error: 'Message is too long.' }, { status: 400 })
  }

  const threadId = sanitizeId(body.threadId) ?? crypto.randomUUID()
  try {
    const result = await askSupport(message, threadId, RESOURCE_ID)
    const text = typeof result.text === 'string' ? result.text.trim() : ''
    if (!text) {
      return Response.json({ error: 'The agent returned an empty reply.' }, { status: 502 })
    }
    return Response.json({
      text,
      threadId,
      mode: resolveModelMode(),
      profile: detectLanguage(message),
      tools: toolNames(result),
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: detail }, { status: 500 })
  }
}
