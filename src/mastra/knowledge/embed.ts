import { normalizeArabic } from '../dialect/detect'

export const EMBEDDING_DIMENSION = 256

const SYNONYM_GROUPS = [
  ['shipping', 'delivery', 'شحن', 'توصيل', 'يوصل', 'بياخد'],
  ['return', 'ارجاع', 'استرجاع', 'نرجع', 'ترجيع', 'مرتجع'],
  ['payment', 'دفع', 'كاش', 'cod', 'بطاقه', 'فيزا'],
  ['hours', 'دوام', 'رمضان', 'مواعيد', 'ساعات'],
  ['damage', 'تالف', 'مكسور', 'عطل', 'damaged', 'broken'],
  ['track', 'تتبع', 'حاله', 'status', 'tracking'],
  ['address', 'عنوان'],
  ['human', 'موظف', 'بشري', 'agent'],
]

const expansions = new Map<string, string[]>()
for (const group of SYNONYM_GROUPS) {
  const normalized = group.map((token) => normalizeArabic(token))
  for (const token of normalized) expansions.set(token, normalized)
}

function hashToken(token: string): number {
  let hash = 2166136261
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash | 0
}

function tokensOf(text: string): string[] {
  const normalized = normalizeArabic(text)
  if (!normalized) return []
  const raw = normalized.split(' ').filter((token) => token.length > 1)
  const tokens = new Set<string>()
  for (const token of raw) {
    tokens.add(token)
    const group = expansions.get(token)
    if (group) for (const synonym of group) tokens.add(synonym)
    if (token.length >= 3) {
      for (let index = 0; index <= token.length - 3; index += 1) {
        tokens.add(token.slice(index, index + 3))
      }
    }
  }
  return [...tokens]
}

/** Deterministic local embedding so FAQ retrieval works with no API key. */
export function embedText(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSION).fill(0)
  const tokens = tokensOf(text)
  for (const token of tokens) {
    const hashed = hashToken(token)
    const index = Math.abs(hashed) % EMBEDDING_DIMENSION
    const current = vector[index] ?? 0
    vector[index] = current + (hashed % 2 === 0 ? 1 : -1)
  }
  const norm = Math.hypot(...vector)
  if (norm === 0) return vector
  return vector.map((value) => value / norm)
}
