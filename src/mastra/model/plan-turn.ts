import { detectLanguage, hasAny, type CustomerStyle } from '../dialect/detect'
import { extractOrderId, findOrder, type SampleOrder } from '../data/orders'
import type { FaqMatch } from '../knowledge/faq-index'
import {
  replyAgentName,
  replyFallback,
  replyFaq,
  replyGreeting,
  replyHandoff,
  replyIntroduced,
  replyName,
  replyNameUnknown,
  replyNeedOrderId,
  replyOrder,
  replyOrderMissing,
  replyTicket,
} from '../dialect/reply'

export type PlannedMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  text: string
  toolName?: string
  toolResult?: unknown
}

export type ToolPlan = {
  kind: 'tool'
  toolName: 'lookupOrder' | 'searchFaq' | 'createTicket' | 'requestHumanHandoff'
  input: Record<string, unknown>
}

export type TextPlan = {
  kind: 'text'
  text: string
  style: CustomerStyle
}

export type TurnPlan = ToolPlan | TextPlan

const HANDOFF = [
  'human',
  'live agent',
  'real person',
  'موظف',
  'حولني',
  'حولوني',
  'ابغى احد',
  'أبغى أحد',
  'بدي احكي',
  'عايز اكلم',
  'اكلم موظف',
  'أكلم موظف',
]
const TICKET = ['ticket', 'تذكرة', 'تذكره', 'شكوى', 'complaint', 'أشتكي', 'اشتكي', 'افتح تذكرة', 'open a case']
const ORDER_TALK = [
  'order status',
  'track my order',
  'حالة الطلب',
  'وين طلبي',
  'فين الطلب',
  'فين الاوردر',
  'تتبع',
  'شن صار في الطلب',
  'شو صار بالطلب',
  'وين الطلب',
]
const FAQ = [
  'shipping',
  'delivery',
  'توصيل',
  'شحن',
  'return',
  'ارجاع',
  'إرجاع',
  'نرجع',
  'payment',
  'دفع',
  'كاش',
  'cod',
  'رمضان',
  'دوام',
  'ساعات',
  'policy',
  'سياسة',
  'عنوان',
  'address',
  'تالف',
  'مكسور',
  'damaged',
  'refund',
  'قد ايه',
  'قد إيه',
  'كم يوم',
]
const GREETING = ['السلام عليكم', 'مرحبا', 'أهلا', 'اهلا', 'هلا', 'hello', 'hi', 'hey', 'صباح الخير']
const NAME_QUESTION = ['شن اسمي', 'ما اسمي', 'اسمي ايه', 'اسمي إيه', 'وش اسمي', 'شو اسمي', "what's my name", 'what is my name', 'who am i']
const AGENT_NAME = ['اسمك', 'مين انت', 'من انت', 'who are you', 'your name']
const FOLLOW_UP = ['الإجمالي', 'الاجمالي', 'المجموع', 'total', 'الحالة', 'status', 'الموعد', 'eta', 'متى يوصل']

function unwrap(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  const record = value as { type?: string; value?: unknown }
  if (
    (record.type === 'json' || record.type === 'text' || record.type === 'error-json' || record.type === 'error-text') &&
    'value' in record
  ) {
    return unwrap(record.value)
  }
  return value
}

function asOrder(value: unknown): SampleOrder | undefined {
  const record = unwrap(value) as { found?: boolean; orderId?: string } | undefined
  if (!record || record.found === false || typeof record.orderId !== 'string') return undefined
  return findOrder(record.orderId)
}

function asFaq(value: unknown, style: CustomerStyle): FaqMatch | undefined {
  const record = unwrap(value) as { matches?: FaqMatch[] } | undefined
  const matches = record?.matches ?? []
  const best = matches[0]
  if (!best) return undefined
  const preferred = style === 'english' ? 'en' : 'ar'
  return matches.find((match) => match.id === best.id && match.language === preferred) ?? best
}

function asTicket(value: unknown): { ticketId?: string; subject?: string; queuePosition?: number } {
  const record = unwrap(value) as { ticketId?: string; subject?: string; queuePosition?: number }
  return record ?? {}
}

function introducedName(text: string): string | null {
  if (hasAny(text, NAME_QUESTION)) return null
  const arabic = text.match(/اسمي\s+([\u0600-\u06FF]{2,})/)
  if (arabic?.[1]) return arabic[1]
  const english = text.match(/\bmy name is\s+([A-Za-z]{2,})/i)
  return english?.[1] ?? null
}

function rememberedName(history: PlannedMessage[]): string | null {
  for (const message of history) {
    if (message.role !== 'user') continue
    const name = introducedName(message.text)
    if (name) return name
  }
  return null
}

function subjectFrom(text: string): string {
  const compact = text.replace(/\s+/g, ' ').trim()
  return compact.length > 80 ? `${compact.slice(0, 77)}...` : compact
}

function priorityFrom(text: string): 'normal' | 'high' {
  return hasAny(text, ['عاجل', 'تالف', 'مكسور', 'damaged', 'urgent', 'broken']) ? 'high' : 'normal'
}

export function planTurn(messages: PlannedMessage[]): TurnPlan {
  const lastUserIndex = messages.findLastIndex((message) => message.role === 'user')
  const current = lastUserIndex >= 0 ? messages[lastUserIndex] : undefined
  const text = current?.text ?? ''
  const style = detectLanguage(text).dialect
  const history = lastUserIndex >= 0 ? messages.slice(0, lastUserIndex) : []
  const freshTools = lastUserIndex >= 0 ? messages.slice(lastUserIndex + 1).filter((message) => message.role === 'tool') : []

  if (freshTools.length > 0) {
    const tool = freshTools[freshTools.length - 1]
    if (tool?.toolName === 'lookupOrder') {
      const order = asOrder(tool.toolResult)
      const requested = extractOrderId(text) ?? 'WRD-00000'
      return {
        kind: 'text',
        style,
        text: order ? replyOrder(style, order) : replyOrderMissing(style, requested),
      }
    }
    if (tool?.toolName === 'searchFaq') {
      return { kind: 'text', style, text: replyFaq(style, asFaq(tool.toolResult, style)) }
    }
    if (tool?.toolName === 'createTicket') {
      const ticket = asTicket(tool.toolResult)
      return {
        kind: 'text',
        style,
        text: replyTicket(style, ticket.ticketId ?? 'TKT-1001', ticket.subject ?? subjectFrom(text)),
      }
    }
    if (tool?.toolName === 'requestHumanHandoff') {
      const ticket = asTicket(tool.toolResult)
      return {
        kind: 'text',
        style,
        text: replyHandoff(style, ticket.ticketId ?? 'TKT-1001', ticket.queuePosition ?? 1),
      }
    }
  }

  const name = rememberedName(history) ?? introducedName(text)
  const orderId = extractOrderId(text)

  if (hasAny(text, HANDOFF)) {
    return {
      kind: 'tool',
      toolName: 'requestHumanHandoff',
      input: {
        reason: subjectFrom(text),
        summary: text,
        ...(name ? { customerName: name } : {}),
      },
    }
  }

  if (hasAny(text, TICKET)) {
    return {
      kind: 'tool',
      toolName: 'createTicket',
      input: {
        subject: subjectFrom(text),
        description: text,
        priority: priorityFrom(text),
        ...(name ? { customerName: name } : {}),
      },
    }
  }

  if (orderId) {
    return { kind: 'tool', toolName: 'lookupOrder', input: { orderId } }
  }

  if (hasAny(text, ORDER_TALK)) {
    return { kind: 'text', style, text: replyNeedOrderId(style) }
  }

  if (hasAny(text, NAME_QUESTION)) {
    const known = rememberedName(history)
    return {
      kind: 'text',
      style,
      text: known ? replyName(style, known) : replyNameUnknown(style),
    }
  }

  if (hasAny(text, AGENT_NAME)) {
    return { kind: 'text', style, text: replyAgentName(style) }
  }

  const intro = introducedName(text)
  if (intro && text.trim().length < 40) {
    return { kind: 'text', style, text: replyIntroduced(style, intro) }
  }

  if (hasAny(text, FAQ)) {
    return { kind: 'tool', toolName: 'searchFaq', input: { query: text } }
  }

  if (hasAny(text, FOLLOW_UP)) {
    const previous = [...history].reverse().find((message) => message.toolName === 'lookupOrder')
    const order = previous ? asOrder(previous.toolResult) : undefined
    if (order) return { kind: 'text', style, text: replyOrder(style, order) }
  }

  if (hasAny(text, GREETING) && text.trim().length < 40) {
    return { kind: 'text', style, text: replyGreeting(style) }
  }

  if (intro) {
    return { kind: 'text', style, text: replyIntroduced(style, intro) }
  }

  return { kind: 'text', style, text: replyFallback(style) }
}
