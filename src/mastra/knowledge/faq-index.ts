import { MDocument } from '@mastra/rag'
import { LibSQLVector } from '@mastra/libsql'
import { FAQ_ARTICLES, type FaqArticle } from './articles'
import { EMBEDDING_DIMENSION, embedText } from './embed'
import { fileUrl } from '../storage/paths'

const INDEX_NAME = 'faq_articles'

export type FaqMatch = {
  id: string
  language: 'ar' | 'en'
  title: string
  answer: string
  score: number
}

let vector: LibSQLVector | undefined
let indexed: Promise<void> | undefined

function store(): LibSQLVector {
  if (!vector) {
    vector = new LibSQLVector({
      id: 'wardi-faq',
      url: fileUrl('FAQ_DB_URL', 'file:./data/faq.db'),
    })
  }
  return vector
}

async function chunkArticle(article: FaqArticle, language: 'ar' | 'en') {
  const title = language === 'ar' ? article.titleAr : article.titleEn
  const answer = language === 'ar' ? article.answerAr : article.answerEn
  const document = MDocument.fromText(`${article.keywords}\n${answer}`, {
    id: `${article.id}-${language}`,
    language,
    title,
    answer,
  })
  const chunks = await document.chunk({ strategy: 'recursive', maxSize: 700, overlap: 0 })
  return chunks.map((chunk, index) => ({
    id: `${article.id}-${language}-${index}`,
    text: `${article.keywords}\n${answer}`,
    metadata: {
      id: article.id,
      language,
      title,
      answer,
    },
  }))
}

export async function ensureFaqIndex(): Promise<void> {
  if (!indexed) {
    indexed = (async () => {
      const libsql = store()
      const existing = await libsql.listIndexes()
      if (existing.includes(INDEX_NAME)) {
        await libsql.deleteIndex({ indexName: INDEX_NAME })
      }
      await libsql.createIndex({ indexName: INDEX_NAME, dimension: EMBEDDING_DIMENSION })
      const passages = (
        await Promise.all(FAQ_ARTICLES.flatMap((article) => [
          chunkArticle(article, 'ar'),
          chunkArticle(article, 'en'),
        ]))
      ).flat()
      await libsql.upsert({
        indexName: INDEX_NAME,
        ids: passages.map((passage) => passage.id),
        vectors: passages.map((passage) => embedText(passage.text)),
        metadata: passages.map((passage) => passage.metadata),
      })
    })()
  }
  await indexed
}

export async function retrieveFaqs(query: string, topK = 3): Promise<FaqMatch[]> {
  await ensureFaqIndex()
  const results = await store().query({
    indexName: INDEX_NAME,
    queryVector: embedText(query),
    topK,
    minScore: 0.12,
  })
  return results.map((result) => {
    const metadata = result.metadata ?? {}
    return {
      id: String(metadata.id ?? result.id),
      language: metadata.language === 'en' ? 'en' : 'ar',
      title: String(metadata.title ?? ''),
      answer: String(metadata.answer ?? ''),
      score: result.score,
    }
  })
}
