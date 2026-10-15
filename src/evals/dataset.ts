import type { CustomerStyle } from '../mastra/dialect/detect'

export type ExpectedTool = 'lookupOrder' | 'searchFaq' | 'createTicket' | 'requestHumanHandoff' | null

export type SupportExpectation = {
  language: 'ar' | 'en'
  dialect: CustomerStyle
  tool: ExpectedTool
  mustMention: string[]
  mustNotMention: string[]
}

export type SupportCase = {
  id: string
  input: string
  groundTruth: SupportExpectation
}

const invented = ['WRD-00000', '9999']

export const supportCases: SupportCase[] = [
  {
    id: 'msa-order',
    input: 'أود معرفة حالة الطلب WRD-10482',
    groundTruth: {
      language: 'ar',
      dialect: 'msa',
      tool: 'lookupOrder',
      mustMention: ['WRD-10482', '86.5'],
      mustNotMention: invented,
    },
  },
  {
    id: 'libyan-order',
    input: 'باهي شن صار في الطلب WRD-11007 توا؟',
    groundTruth: {
      language: 'ar',
      dialect: 'libyan',
      tool: 'lookupOrder',
      mustMention: ['WRD-11007', '142'],
      mustNotMention: ['86.5', ...invented],
    },
  },
  {
    id: 'egyptian-order',
    input: 'عايز أعرف الأوردر WRD-09831 وصل ولا لسه؟',
    groundTruth: {
      language: 'ar',
      dialect: 'egyptian',
      tool: 'lookupOrder',
      mustMention: ['WRD-09831', '18.75'],
      mustNotMention: invented,
    },
  },
  {
    id: 'gulf-order',
    input: 'أبغى أتابع الطلب WRD-12190 الحين',
    groundTruth: {
      language: 'ar',
      dialect: 'gulf',
      tool: 'lookupOrder',
      mustMention: ['WRD-12190', '24'],
      mustNotMention: invented,
    },
  },
  {
    id: 'levantine-order',
    input: 'بدي أعرف وين صار الطلب WRD-10482',
    groundTruth: {
      language: 'ar',
      dialect: 'levantine',
      tool: 'lookupOrder',
      mustMention: ['WRD-10482', '86.5'],
      mustNotMention: invented,
    },
  },
  {
    id: 'english-order',
    input: "What's the status of order WRD-11007?",
    groundTruth: {
      language: 'en',
      dialect: 'english',
      tool: 'lookupOrder',
      mustMention: ['WRD-11007', '142', 'Cairo'],
      mustNotMention: invented,
    },
  },
  {
    id: 'egyptian-faq',
    input: 'التوصيل بياخد قد إيه؟',
    groundTruth: {
      language: 'ar',
      dialect: 'egyptian',
      tool: 'searchFaq',
      mustMention: ['2 إلى 5 أيام عمل'],
      mustNotMention: invented,
    },
  },
  {
    id: 'libyan-faq',
    input: 'علاش نقدر نرجع الحاجة؟',
    groundTruth: {
      language: 'ar',
      dialect: 'libyan',
      tool: 'searchFaq',
      mustMention: ['14'],
      mustNotMention: invented,
    },
  },
  {
    id: 'english-faq',
    input: 'How long does shipping take?',
    groundTruth: {
      language: 'en',
      dialect: 'english',
      tool: 'searchFaq',
      mustMention: ['2 to 5 business days'],
      mustNotMention: invented,
    },
  },
  {
    id: 'gulf-handoff',
    input: 'حولني على موظف الحين، أبي أكلم أحد',
    groundTruth: {
      language: 'ar',
      dialect: 'gulf',
      tool: 'requestHumanHandoff',
      mustMention: ['TKT-', 'موظف'],
      mustNotMention: invented,
    },
  },
  {
    id: 'english-ticket',
    input: 'Please open a ticket about a damaged jar',
    groundTruth: {
      language: 'en',
      dialect: 'english',
      tool: 'createTicket',
      mustMention: ['TKT-'],
      mustNotMention: invented,
    },
  },
  {
    id: 'msa-greeting',
    input: 'السلام عليكم',
    groundTruth: {
      language: 'ar',
      dialect: 'msa',
      tool: null,
      mustMention: ['ليلى'],
      mustNotMention: ['باهي', 'توا', 'عايز', 'الحين', 'بدك', ...invented],
    },
  },
]
