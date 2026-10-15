export const DIALECTS = ['msa', 'libyan', 'egyptian', 'gulf', 'levantine'] as const

export type Dialect = (typeof DIALECTS)[number]

export type CustomerStyle = Dialect | 'english'

export type LanguageProfile = {
  language: 'ar' | 'en'
  dialect: CustomerStyle
  markers: string[]
}

const DISTINCTIVE: Record<Exclude<Dialect, 'msa'>, string[]> = {
  libyan: ['باهي', 'توا', 'علاش', 'هكي', 'هلبة', 'شنو', 'شن', 'واش'],
  egyptian: ['ازيك', 'إزيك', 'عايز', 'عايزة', 'دلوقتي', 'كده', 'كدة', 'فين', 'بتاع', 'معلش', 'يا فندم', 'بياخد', 'قد ايه', 'ازاي'],
  gulf: ['ابغى', 'أبغى', 'الحين', 'هالحين', 'شلون', 'وشلون', 'تبي', 'شخبارك', 'ايش'],
  levantine: ['بدي', 'بدك', 'هلق', 'هلأ', 'هيك', 'منيح', 'كتير', 'شو'],
}

const SHARED: Array<{ phrase: string; dialects: Array<Exclude<Dialect, 'msa'>> }> = [
  { phrase: 'ليش', dialects: ['gulf', 'levantine'] },
  { phrase: 'وين', dialects: ['libyan', 'levantine'] },
  { phrase: 'مش', dialects: ['libyan', 'egyptian'] },
]

const ARABIZI: Array<{ phrase: string; dialect: Exclude<Dialect, 'msa'> }> = [
  { phrase: 'bahi', dialect: 'libyan' },
  { phrase: 'tawa', dialect: 'libyan' },
  { phrase: '3ayez', dialect: 'egyptian' },
  { phrase: 'ezayak', dialect: 'egyptian' },
  { phrase: 'abgha', dialect: 'gulf' },
  { phrase: 'al7een', dialect: 'gulf' },
  { phrase: 'baddi', dialect: 'levantine' },
  { phrase: 'halla2', dialect: 'levantine' },
]

/** Markers the reply scorer expects the mock (and a careful model) to echo. */
export const REPLY_MARKERS: Record<Exclude<Dialect, 'msa'>, string[]> = {
  libyan: ['باهي', 'توا', 'علاش', 'هكي'],
  egyptian: ['عايز', 'عايزة', 'دلوقتي', 'ازيك', 'إزيك', 'كده'],
  gulf: ['الحين', 'زين', 'أبغى', 'ابغى', 'شلون', 'تبي'],
  levantine: ['بدي', 'بدك', 'هلق', 'هيك', 'منيح'],
}

export function normalizeArabic(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function containsPhrase(normalized: string, phrase: string): boolean {
  const normalizedPhrase = normalizeArabic(phrase)
  if (!normalizedPhrase) return false
  if (normalizedPhrase.includes(' ')) return normalized.includes(normalizedPhrase)
  return normalized.split(' ').includes(normalizedPhrase)
}

export function hasAny(text: string, phrases: string[]): boolean {
  const normalized = normalizeArabic(text)
  return phrases.some((phrase) => containsPhrase(normalized, phrase))
}

export function detectLanguage(text: string): LanguageProfile {
  const arabicLetters = text.match(/[\u0600-\u06FF]/g)?.length ?? 0
  const latinLetters = text.match(/[A-Za-z]/g)?.length ?? 0
  const normalized = normalizeArabic(text)

  if (arabicLetters === 0) {
    const arabizi = ARABIZI.filter((entry) => containsPhrase(normalized, entry.phrase))
    if (arabizi.length > 0 && latinLetters > 0) {
      const dialect = arabizi[0]?.dialect ?? 'msa'
      return { language: 'ar', dialect, markers: arabizi.map((entry) => entry.phrase) }
    }
    return { language: 'en', dialect: 'english', markers: [] }
  }

  const scores: Record<Exclude<Dialect, 'msa'>, number> = {
    libyan: 0,
    egyptian: 0,
    gulf: 0,
    levantine: 0,
  }
  const markers: string[] = []

  for (const dialect of Object.keys(DISTINCTIVE) as Array<Exclude<Dialect, 'msa'>>) {
    for (const phrase of DISTINCTIVE[dialect]) {
      if (containsPhrase(normalized, phrase)) {
        scores[dialect] += 2
        markers.push(phrase)
      }
    }
  }

  for (const shared of SHARED) {
    if (!containsPhrase(normalized, shared.phrase)) continue
    markers.push(shared.phrase)
    for (const dialect of shared.dialects) scores[dialect] += 1
  }

  const ranked = (Object.keys(scores) as Array<Exclude<Dialect, 'msa'>>).sort(
    (a, b) => scores[b] - scores[a],
  )
  const best = ranked[0]
  const second = ranked[1]
  if (best && scores[best] >= 2 && (!second || scores[best] > scores[second])) {
    return { language: 'ar', dialect: best, markers }
  }

  return { language: 'ar', dialect: 'msa', markers }
}

export function scriptDirection(text: string): 'rtl' | 'ltr' {
  const arabicLetters = text.match(/[\u0600-\u06FF]/g)?.length ?? 0
  const latinLetters = text.match(/[A-Za-z]/g)?.length ?? 0
  return arabicLetters > latinLetters ? 'rtl' : 'ltr'
}
