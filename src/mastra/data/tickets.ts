import { createClient, type Client } from '@libsql/client'
import { fileUrl } from '../storage/paths'

export type TicketPriority = 'low' | 'normal' | 'high'
export type TicketKind = 'ticket' | 'handoff'

export type SupportTicket = {
  ticketId: string
  subject: string
  description: string
  priority: TicketPriority
  kind: TicketKind
  status: 'open' | 'waiting_for_human'
  customerName: string | null
  queuePosition: number | null
  createdAt: string
}

let client: Client | undefined
let ready: Promise<void> | undefined

function database(): Client {
  if (!client) {
    client = createClient({ url: fileUrl('TICKET_DB_URL', 'file:./data/tickets.db') })
  }
  return client
}

async function ensureTable(): Promise<void> {
  if (!ready) {
    ready = database().execute(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL,
        kind TEXT NOT NULL,
        status TEXT NOT NULL,
        customer_name TEXT,
        created_at TEXT NOT NULL
      )
    `).then(() => undefined)
  }
  await ready
}

export async function createTicketRecord(input: {
  subject: string
  description: string
  priority: TicketPriority
  kind: TicketKind
  customerName?: string | null
}): Promise<SupportTicket> {
  await ensureTable()
  const db = database()
  const count = await db.execute('SELECT COUNT(*) AS total FROM support_tickets')
  const total = Number(count.rows[0]?.total ?? 0)
  const ticketId = `TKT-${1001 + total}`
  const createdAt = new Date().toISOString()
  const status = input.kind === 'handoff' ? 'waiting_for_human' : 'open'
  await db.execute({
    sql: `INSERT INTO support_tickets
      (id, subject, description, priority, kind, status, customer_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      ticketId,
      input.subject,
      input.description,
      input.priority,
      input.kind,
      status,
      input.customerName ?? null,
      createdAt,
    ],
  })

  let queuePosition: number | null = null
  if (input.kind === 'handoff') {
    const waiting = await db.execute(
      "SELECT COUNT(*) AS total FROM support_tickets WHERE kind = 'handoff'",
    )
    queuePosition = Number(waiting.rows[0]?.total ?? 1)
  }

  return {
    ticketId,
    subject: input.subject,
    description: input.description,
    priority: input.priority,
    kind: input.kind,
    status,
    customerName: input.customerName ?? null,
    queuePosition,
    createdAt,
  }
}
