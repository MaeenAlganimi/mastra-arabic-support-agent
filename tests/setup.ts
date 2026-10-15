import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const directory = mkdtempSync(join(tmpdir(), 'wardi-'))
process.env.SUPPORT_MODEL_MODE = 'mock'
process.env.LIBSQL_URL = `file:${join(directory, 'memory.db')}`
process.env.FAQ_DB_URL = `file:${join(directory, 'faq.db')}`
process.env.TICKET_DB_URL = `file:${join(directory, 'tickets.db')}`
delete process.env.OPENAI_API_KEY
delete process.env.GOOGLE_API_KEY
delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
delete process.env.DATABASE_URL
