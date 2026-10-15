import { LibSQLStore } from '@mastra/libsql'
import { PostgresStore } from '@mastra/pg'
import { memoryDatabaseTarget } from './paths'

export type SupportStorage = LibSQLStore | PostgresStore

let storage: SupportStorage | undefined

/** One store shared by conversation memory and the Mastra instance. */
export function getSupportStorage(): SupportStorage {
  if (storage) return storage
  const target = memoryDatabaseTarget()
  storage =
    target.kind === 'postgres'
      ? new PostgresStore({
          id: 'wardi-postgres',
          connectionString: target.url,
        })
      : new LibSQLStore({
          id: 'wardi-libsql',
          url: target.url,
        })
  return storage
}
