import type { CustomerStyle } from './detect'
import type { OrderStatus, SampleOrder } from '../data/orders'
import type { FaqMatch } from '../knowledge/faq-index'

const STATUS_LABELS: Record<OrderStatus, Record<CustomerStyle, string>> = {
  out_for_delivery: {
    msa: 'خرج للتسليم',
    libyan: 'طلع للتوصيل',
    egyptian: 'خارج للتوصيل',
    gulf: 'طلع للتوصيل',
    levantine: 'طلع عالتوصيل',
    english: 'out for delivery',
  },
  delayed: {
    msa: 'متأخر',
    libyan: 'تأخر',
    egyptian: 'متأخر',
    gulf: 'متأخر',
    levantine: 'مأخر',
    english: 'delayed',
  },
  delivered: {
    msa: 'تم تسليمه',
    libyan: 'توصل',
    egyptian: 'اتسلم',
    gulf: 'توصل',
    levantine: 'وصل',
    english: 'delivered',
  },
  processing: {
    msa: 'قيد التجهيز',
    libyan: 'قاعد يتجهز',
    egyptian: 'بيتجهز',
    gulf: 'قيد التجهيز',
    levantine: 'عم يتجهز',
    english: 'being prepared',
  },
  cancelled: {
    msa: 'ملغى',
    libyan: 'تلغى',
    egyptian: 'اتلغى',
    gulf: 'ملغي',
    levantine: 'انلغى',
    english: 'cancelled',
  },
}

function closer(style: CustomerStyle): string {
  switch (style) {
    case 'libyan':
      return 'إذا تحتاج شي توا قول لي.'
    case 'egyptian':
      return 'لو عايز حاجة تانية قولي.'
    case 'gulf':
      return 'إذا تبي شي ثاني الحين قل لي.'
    case 'levantine':
      return 'إذا بدك شي تاني خبرني.'
    case 'msa':
      return 'يسعدني مساعدتك في أي طلب آخر.'
    default:
      return 'Tell me if you need anything else.'
  }
}

function lead(style: CustomerStyle): string {
  switch (style) {
    case 'libyan':
      return 'باهي،'
    case 'egyptian':
      return 'حاضر،'
    case 'gulf':
      return 'زين،'
    case 'levantine':
      return 'تمام،'
    case 'msa':
      return 'تفضل،'
    default:
      return 'Sure.'
  }
}

function joinParts(parts: string[]): string {
  return parts.filter(Boolean).join(' ')
}

export function replyOrder(style: CustomerStyle, order: SampleOrder): string {
  const city = style === 'english' ? order.cityEn : order.cityAr
  const status = STATUS_LABELS[order.status][style]
  const items = order.items
    .map((item) => (style === 'english' ? item.nameEn : item.nameAr))
    .join(style === 'english' ? ', ' : '، ')
  const when = order.deliveredOn
    ? style === 'english'
      ? `It was delivered on ${order.deliveredOn}.`
      : `تاريخ التسليم ${order.deliveredOn}.`
    : order.eta
      ? style === 'english'
        ? `The expected date is ${order.eta}.`
        : `الموعد المتوقع ${order.eta}.`
      : ''
  const money = `${order.totalAmount} ${order.currency}`
  const body =
    style === 'english'
      ? `Order ${order.orderId} is ${status} to ${city}. Items: ${items}. The total is ${money}. ${when}`
      : `الطلب ${order.orderId} ${status} إلى ${city}. الأصناف: ${items}. الإجمالي ${money}. ${when}`
  return joinParts([lead(style), body, closer(style)])
}

export function replyOrderMissing(style: CustomerStyle, orderId: string): string {
  const body =
    style === 'english'
      ? `I could not find order ${orderId}.`
      : `ما لقيت الطلب ${orderId}.`
  return joinParts([lead(style), body, closer(style)])
}

export function replyNeedOrderId(style: CustomerStyle): string {
  const body =
    style === 'english'
      ? 'Send the order id that starts with WRD and I will look it up.'
      : 'أرسل رقم الطلب الذي يبدأ بـ WRD وأتابع حالته.'
  return joinParts([lead(style), body, closer(style)])
}

export function replyFaq(style: CustomerStyle, match: FaqMatch | undefined): string {
  if (!match) {
    const body =
      style === 'english'
        ? 'I do not have a note about that in the sample knowledge base.'
        : 'ما عندي ملاحظة عن هذا في قاعدة المعرفة التجريبية.'
    return joinParts([lead(style), body, closer(style)])
  }
  const answer = style === 'english' && match.language === 'ar'
    ? match.answer
    : match.answer
  const body =
    style === 'english'
      ? `From the Bayt Wardi notes: ${answer}`
      : `حسب ملاحظات بيت وردي: ${answer}`
  return joinParts([lead(style), body, closer(style)])
}

export function replyTicket(style: CustomerStyle, ticketId: string, subject: string): string {
  const body =
    style === 'english'
      ? `I opened ticket ${ticketId} for "${subject}".`
      : `فتحت التذكرة ${ticketId} بخصوص "${subject}".`
  return joinParts([lead(style), body, closer(style)])
}

export function replyHandoff(style: CustomerStyle, ticketId: string, position: number): string {
  const body =
    style === 'english'
      ? `I handed this to a human colleague. The follow-up is ${ticketId} and your queue position is ${position}.`
      : `حوّلتك إلى موظف. رقم المتابعة ${ticketId} وترتيبك في الدور ${position}.`
  return joinParts([lead(style), body, closer(style)])
}

export function replyGreeting(style: CustomerStyle): string {
  const body =
    style === 'english'
      ? 'Hello, I am Layla from Bayt Wardi support.'
      : 'أهلاً، أنا ليلى من دعم بيت وردي.'
  return joinParts([style === 'msa' ? 'وعليكم السلام.' : lead(style), body, closer(style)])
}

export function replyName(style: CustomerStyle, name: string): string {
  const body = style === 'english' ? `Your name is ${name}.` : `اسمك ${name}.`
  return joinParts([lead(style), body, closer(style)])
}

export function replyNameUnknown(style: CustomerStyle): string {
  const body =
    style === 'english'
      ? 'I do not have your name in this conversation yet.'
      : 'ما عندي اسمك في هذه المحادثة بعد.'
  return joinParts([lead(style), body, closer(style)])
}

export function replyIntroduced(style: CustomerStyle, name: string): string {
  const body = style === 'english' ? `I will remember that your name is ${name}.` : `سجلت إن اسمك ${name}.`
  return joinParts([lead(style), body, closer(style)])
}

export function replyAgentName(style: CustomerStyle): string {
  const body = style === 'english' ? 'I am Layla from Bayt Wardi support.' : 'أنا ليلى من دعم بيت وردي.'
  return joinParts([lead(style), body, closer(style)])
}

export function replyFallback(style: CustomerStyle): string {
  const body =
    style === 'english'
      ? 'I can check an order, answer a shop question, open a ticket, or bring in a person.'
      : 'أقدر أتابع طلباً، أو أجيب عن سؤال في المتجر، أو أفتح تذكرة، أو أحوّلك لموظف.'
  return joinParts([lead(style), body, closer(style)])
}
