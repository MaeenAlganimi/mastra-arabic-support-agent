import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { extractOrderId, findOrder } from '../data/orders'
import { createTicketRecord } from '../data/tickets'
import { retrieveFaqs } from '../knowledge/faq-index'

export const lookupOrderTool = createTool({
  id: 'lookupOrder',
  description:
    'Look up a Bayt Wardi order by its WRD id. Use this for shipping status, totals, items, and delivery dates. Do not invent an order id.',
  inputSchema: z.object({
    orderId: z.string().describe('Order id such as WRD-10482'),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    orderId: z.string(),
    customerName: z.string().optional(),
    cityAr: z.string().optional(),
    cityEn: z.string().optional(),
    status: z.string().optional(),
    items: z.array(z.object({ nameAr: z.string(), nameEn: z.string(), qty: z.number() })).optional(),
    totalAmount: z.number().optional(),
    currency: z.string().optional(),
    eta: z.string().nullable().optional(),
    deliveredOn: z.string().nullable().optional(),
  }),
  execute: async ({ orderId }) => {
    const resolved = extractOrderId(orderId) ?? orderId.trim().toUpperCase()
    const order = findOrder(resolved)
    if (!order) return { found: false, orderId: resolved }
    return { found: true, ...order }
  },
})

export const searchFaqTool = createTool({
  id: 'searchFaq',
  description:
    'Retrieve Bayt Wardi policy notes about shipping, returns, payment, damaged goods, hours, address changes, and tracking. Answer only from the returned notes.',
  inputSchema: z.object({
    query: z.string().describe('The customer question, in their own words'),
  }),
  outputSchema: z.object({
    query: z.string(),
    matches: z.array(
      z.object({
        id: z.string(),
        language: z.enum(['ar', 'en']),
        title: z.string(),
        answer: z.string(),
        score: z.number(),
      }),
    ),
  }),
  execute: async ({ query }) => {
    const matches = await retrieveFaqs(query, 8)
    return { query, matches }
  },
})

export const createTicketTool = createTool({
  id: 'createTicket',
  description:
    'Open a support ticket when the customer reports a problem or asks for a case number. Do not use this when they only ask for a policy.',
  inputSchema: z.object({
    subject: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'normal', 'high']),
    customerName: z.string().optional(),
  }),
  outputSchema: z.object({
    ticketId: z.string(),
    status: z.literal('open'),
    priority: z.enum(['low', 'normal', 'high']),
    subject: z.string(),
  }),
  execute: async ({ subject, description, priority, customerName }) => {
    const ticket = await createTicketRecord({
      subject,
      description,
      priority,
      kind: 'ticket',
      customerName,
    })
    return {
      ticketId: ticket.ticketId,
      status: 'open' as const,
      priority: ticket.priority,
      subject: ticket.subject,
    }
  },
})

export const requestHumanHandoffTool = createTool({
  id: 'requestHumanHandoff',
  description:
    'Hand the conversation to a human support agent when the customer asks for a person. Returns a queue ticket.',
  inputSchema: z.object({
    reason: z.string(),
    summary: z.string(),
    customerName: z.string().optional(),
  }),
  outputSchema: z.object({
    ticketId: z.string(),
    status: z.literal('waiting_for_human'),
    queuePosition: z.number(),
    reason: z.string(),
  }),
  execute: async ({ reason, summary, customerName }) => {
    const ticket = await createTicketRecord({
      subject: reason,
      description: summary,
      priority: 'high',
      kind: 'handoff',
      customerName,
    })
    return {
      ticketId: ticket.ticketId,
      status: 'waiting_for_human' as const,
      queuePosition: ticket.queuePosition ?? 1,
      reason,
    }
  },
})

export const supportTools = {
  lookupOrder: lookupOrderTool,
  searchFaq: searchFaqTool,
  createTicket: createTicketTool,
  requestHumanHandoff: requestHumanHandoffTool,
}
