import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export function fileUrl(envName: string, fallback: string): string {
  const url = process.env[envName] || fallback
  if (url.startsWith('file:') && !url.includes(':memory:')) {
    const filePath = url.slice('file:'.length)
    mkdirSync(dirname(filePath), { recursive: true })
  }
  return url
}

export function memoryDatabaseTarget(): { kind: 'postgres'; url: string } | { kind: 'libsql'; url: string } {
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl && /^postgres(ql)?:/i.test(databaseUrl)) {
    return { kind: 'postgres', url: databaseUrl }
  }
  return { kind: 'libsql', url: fileUrl('LIBSQL_URL', 'file:./data/memory.db') }
}
