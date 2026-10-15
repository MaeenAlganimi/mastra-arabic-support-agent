'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { SAMPLE_ORDERS } from '@/mastra/data/orders'
import { scriptDirection, type CustomerStyle } from '@/mastra/dialect/detect'

type UiLanguage = 'ar' | 'en'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  dialect?: CustomerStyle
  tools?: string[]
}

const COPY = {
  ar: {
    brand: 'Bayt Wardi',
    local: 'بيت وردي',
    lede: 'دعم متجر تجريبي للتمور والبيت. يرد بالعربية، بلهجتك، أو بالإنجليزية.',
    desk: 'مكتب ليلى',
    hint: 'الطلبات التالية عيّنة ثابتة حتى تستبدلها ببيانات متجرك.',
    orders: 'طلبات للتجربة',
    welcome: 'أهلًا، أنا ليلى',
    welcomeBody: 'اكتب بالفصحى أو باللهجة أو بالإنجليزية. أتابع الطلب، وأبحث في ملاحظات المتجر، وأفتح تذكرة أو أحوّلك لموظف.',
    placeholder: 'اكتب رسالتك',
    send: 'إرسال',
    sending: 'جارٍ الرد',
    newChat: 'محادثة جديدة',
    demo: 'نموذج تجريبي',
    openai: 'OpenAI',
    google: 'Google',
    dialect: {
      msa: 'فصحى',
      libyan: 'ليبي',
      egyptian: 'مصري',
      gulf: 'خليجي',
      levantine: 'شامي',
      english: 'English',
    } satisfies Record<CustomerStyle, string>,
    tools: {
      lookupOrder: 'استعلام عن طلب',
      searchFaq: 'بحث في الأسئلة',
      createTicket: 'تذكرة',
      requestHumanHandoff: 'تحويل لموظف',
    },
    suggestions: [
      'باهي شن صار في الطلب WRD-10482؟',
      'التوصيل بياخد قد إيه؟',
      'أبغى أكلم موظف الحين',
      'أود معرفة سياسة الإرجاع',
    ],
    status: {
      processing: 'قيد التجهيز',
      out_for_delivery: 'خرج للتوصيل',
      delivered: 'تم التسليم',
      delayed: 'متأخر',
      cancelled: 'ملغى',
    },
  },
  en: {
    brand: 'Bayt Wardi',
    local: 'بيت وردي',
    lede: 'A sample pantry-and-home shop desk. It answers in English or in the Arabic dialect you use.',
    desk: "Layla's desk",
    hint: 'These orders are fixed sample data. Replace them with your own shop.',
    orders: 'Orders to try',
    welcome: 'Hello, I am Layla',
    welcomeBody: 'Write in English, MSA, or a regional dialect. I can check an order, search shop notes, open a ticket, or hand you to a person.',
    placeholder: 'Write a message',
    send: 'Send',
    sending: 'Replying',
    newChat: 'New chat',
    demo: 'Demo model',
    openai: 'OpenAI',
    google: 'Google',
    dialect: {
      msa: 'MSA',
      libyan: 'Libyan',
      egyptian: 'Egyptian',
      gulf: 'Gulf',
      levantine: 'Levantine',
      english: 'English',
    } satisfies Record<CustomerStyle, string>,
    tools: {
      lookupOrder: 'Order lookup',
      searchFaq: 'FAQ search',
      createTicket: 'Ticket',
      requestHumanHandoff: 'Human handoff',
    },
    suggestions: [
      "What's the status of order WRD-11007?",
      'How long does shipping take?',
      'Please open a ticket about a damaged jar',
      'I need a human agent',
    ],
    status: {
      processing: 'Being prepared',
      out_for_delivery: 'Out for delivery',
      delivered: 'Delivered',
      delayed: 'Delayed',
      cancelled: 'Cancelled',
    },
  },
} as const

function createThreadId(): string {
  return `thread-${crypto.randomUUID()}`
}

export function SupportChat() {
  const [ui, setUi] = useState<UiLanguage>('ar')
  const [threadId, setThreadId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'mock' | 'openai' | 'google'>('mock')
  const transcriptRef = useRef<HTMLDivElement>(null)
  const copy = COPY[ui]
  const direction = scriptDirection(draft || messages.at(-1)?.text || (ui === 'ar' ? 'مرحبا' : 'Hello'))

  useEffect(() => {
    const stored = window.sessionStorage.getItem('wardi-thread')
    const nextThread = stored && /^thread-[A-Za-z0-9-]{8,80}$/.test(stored) ? stored : createThreadId()
    window.sessionStorage.setItem('wardi-thread', nextThread)
    setThreadId(nextThread)
    void fetch(`/api/chat?threadId=${nextThread}`)
      .then((response) => response.json())
      .then((payload: { mode?: 'mock' | 'openai' | 'google'; messages?: Array<{ role: 'user' | 'assistant'; text: string }> }) => {
        if (payload.mode) setMode(payload.mode)
        if (payload.messages?.length) {
          setMessages((current) =>
            current.length > 0
              ? current
              : payload.messages!.map((message) => ({ ...message, id: crypto.randomUUID() })),
          )
        }
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    document.documentElement.lang = direction === 'rtl' ? 'ar' : 'en'
    document.documentElement.dir = direction
  }, [direction])

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight })
  }, [messages, pending])

  const modeLabel = mode === 'openai' ? copy.openai : mode === 'google' ? copy.google : copy.demo

  const orderCards = useMemo(
    () =>
      SAMPLE_ORDERS.map((order) => ({
        id: order.orderId,
        city: ui === 'ar' ? order.cityAr : order.cityEn,
        status: copy.status[order.status],
      })),
    [copy.status, ui],
  )

  async function send(text: string) {
    const message = text.trim()
    if (!message || pending || !threadId) return
    setDraft('')
    setError('')
    setPending(true)
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', text: message }])
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, threadId }),
      })
      const payload = (await response.json()) as {
        text?: string
        error?: string
        profile?: { dialect: CustomerStyle }
        tools?: string[]
        mode?: 'mock' | 'openai' | 'google'
      }
      if (!response.ok || !payload.text) {
        throw new Error(payload.error || 'Request failed')
      }
      if (payload.mode) setMode(payload.mode)
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: payload.text ?? '',
          dialect: payload.profile?.dialect,
          tools: payload.tools,
        },
      ])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Request failed')
    } finally {
      setPending(false)
    }
  }

  function startOver() {
    const nextThread = createThreadId()
    window.sessionStorage.setItem('wardi-thread', nextThread)
    setThreadId(nextThread)
    setMessages([])
    setError('')
    setDraft('')
  }

  return (
    <div className="shell">
      <aside className="panel">
        <div className="mark">
          <strong>{copy.brand}</strong>
          <span>{copy.local}</span>
        </div>
        <p className="lede">{copy.lede}</p>
        <div className="mode">
          <i />
          {modeLabel}
        </div>
        <div className="orders">
          <h2>{copy.orders}</h2>
          {orderCards.map((order) => (
            <button
              key={order.id}
              type="button"
              className="order"
              onClick={() =>
                setDraft(
                  ui === 'ar'
                    ? `باهي شن صار في الطلب ${order.id}؟`
                    : `What's the status of order ${order.id}?`,
                )
              }
            >
              <b>{order.id}</b>
              <span className="order-meta">
                {order.city} · {order.status}
              </span>
            </button>
          ))}
          <p className="hint">{copy.hint}</p>
        </div>
      </aside>
      <main className="stage">
        <header className="stage-head">
          <div>
            <h1>{copy.desk}</h1>
            <p>{threadId ? threadId : '…'}</p>
          </div>
          <div className="switch" role="group" aria-label={ui === 'ar' ? 'لغة الواجهة' : 'Interface language'}>
            <button type="button" aria-pressed={ui === 'ar'} onClick={() => setUi('ar')}>
              العربية
            </button>
            <button type="button" aria-pressed={ui === 'en'} onClick={() => setUi('en')}>
              English
            </button>
            <button type="button" className="ghost" onClick={startOver}>
              {copy.newChat}
            </button>
          </div>
        </header>
        <div className="transcript" ref={transcriptRef} aria-live="polite">
          {messages.length === 0 ? (
            <div className="empty">
              <h2>{copy.welcome}</h2>
              <p>{copy.welcomeBody}</p>
              <div className="suggestions">
                {copy.suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => void send(suggestion)} disabled={pending || !threadId}>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <article key={message.id} className={`bubble ${message.role}`} dir={scriptDirection(message.text)}>
                {message.text}
                {message.role === 'assistant' && (message.dialect || message.tools?.length) ? (
                  <div className="meta">
                    {message.dialect ? <span className="chip">{copy.dialect[message.dialect]}</span> : null}
                    {message.tools?.map((tool) => (
                      <span key={tool} className="chip">
                        {copy.tools[tool as keyof typeof copy.tools] ?? tool}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
        {error ? <p className="error">{error}</p> : null}
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault()
            void send(draft)
          }}
        >
          <label className="sr-only" htmlFor="message">
            {copy.placeholder}
          </label>
          <textarea
            id="message"
            dir={direction}
            value={draft}
            placeholder={copy.placeholder}
            rows={2}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void send(draft)
              }
            }}
          />
          <button className="send" type="submit" disabled={pending || !draft.trim() || !threadId}>
            {pending ? copy.sending : copy.send}
          </button>
        </form>
      </main>
    </div>
  )
}
