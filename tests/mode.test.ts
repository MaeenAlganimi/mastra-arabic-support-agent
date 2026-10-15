import { afterEach, describe, expect, it } from 'vitest'
import { memoryDatabaseTarget } from '../src/mastra/storage/paths'
import { resolveModelMode, resolveSupportModel } from '../src/mastra/model/resolve-model'

const original = {
  DATABASE_URL: process.env.DATABASE_URL,
  LIBSQL_URL: process.env.LIBSQL_URL,
}

afterEach(() => {
  if (original.DATABASE_URL === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = original.DATABASE_URL
  if (original.LIBSQL_URL === undefined) delete process.env.LIBSQL_URL
  else process.env.LIBSQL_URL = original.LIBSQL_URL
})

describe('model and memory selection', () => {
  it('stays on the mock model when no provider key is set', () => {
    expect(resolveModelMode({})).toBe('mock')
    const model = resolveSupportModel({})
    expect(typeof model).toBe('object')
    expect(model).toMatchObject({ modelId: 'wardi-support-mock' })
  })

  it('uses OpenAI or Google when those keys are present', () => {
    expect(resolveModelMode({ OPENAI_API_KEY: 'test' })).toBe('openai')
    expect(resolveSupportModel({ OPENAI_API_KEY: 'test' })).toBe('openai/gpt-5.6-sol')
    expect(resolveModelMode({ GOOGLE_GENERATIVE_AI_API_KEY: 'test' })).toBe('google')
    expect(resolveSupportModel({ GOOGLE_GENERATIVE_AI_API_KEY: 'test' })).toBe('google/gemini-2.5-flash')
  })

  it('keeps an explicit mock mode even if a key is present', () => {
    expect(resolveModelMode({ SUPPORT_MODEL_MODE: 'mock', OPENAI_API_KEY: 'test' })).toBe('mock')
  })

  it('points conversation memory at Postgres for a Supabase-style URL', () => {
    process.env.DATABASE_URL = 'postgresql://postgres:secret@db.example.supabase.co:5432/postgres'
    expect(memoryDatabaseTarget()).toEqual({
      kind: 'postgres',
      url: process.env.DATABASE_URL,
    })
  })

  it('uses local LibSQL when no Postgres URL is configured', () => {
    delete process.env.DATABASE_URL
    expect(memoryDatabaseTarget().kind).toBe('libsql')
  })
})
