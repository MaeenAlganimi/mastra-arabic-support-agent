import { Memory } from '@mastra/memory'
import { getSupportStorage } from '../storage/create-storage'

/**
 * Mastra message history.
 * Local LibSQL is the default. A postgres connection string, including Supabase,
 * switches the same Memory instance to PostgresStore.
 * Semantic recall stays off so the demo does not need an embedding API.
 */
export function createSupportMemory(): Memory {
  return new Memory({
    storage: getSupportStorage(),
    options: {
      lastMessages: 20,
    },
  })
}
