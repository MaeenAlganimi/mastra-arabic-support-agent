export type OrderStatus = 'processing' | 'out_for_delivery' | 'delivered' | 'delayed' | 'cancelled'

export type SampleOrder = {
  orderId: string
  customerName: string
  cityAr: string
  cityEn: string
  items: Array<{ nameAr: string; nameEn: string; qty: number }>
  status: OrderStatus
  totalAmount: number
  currency: string
  eta: string | null
  deliveredOn: string | null
}

/** Fictional pantry shop used by the template. Replace this list with your order API. */
export const SAMPLE_ORDERS: SampleOrder[] = [
  {
    orderId: 'WRD-10482',
    customerName: 'سالم المقريف',
    cityAr: 'طرابلس',
    cityEn: 'Tripoli',
    items: [
      { nameAr: 'تمر دقلة نور', nameEn: 'Deglet Nour dates', qty: 1 },
      { nameAr: 'قهوة عربية محمصة', nameEn: 'Roasted Arabic coffee', qty: 1 },
    ],
    status: 'out_for_delivery',
    totalAmount: 86.5,
    currency: 'LYD',
    eta: '2026-10-15',
    deliveredOn: null,
  },
  {
    orderId: 'WRD-11007',
    customerName: 'منى عبد السلام',
    cityAr: 'القاهرة',
    cityEn: 'Cairo',
    items: [
      { nameAr: 'طقم مفارش كتّان', nameEn: 'Linen table set', qty: 1 },
      { nameAr: 'زيت زيتون 750 مل', nameEn: 'Olive oil 750ml', qty: 2 },
    ],
    status: 'delayed',
    totalAmount: 142,
    currency: 'EGP',
    eta: '2026-10-18',
    deliveredOn: null,
  },
  {
    orderId: 'WRD-09831',
    customerName: 'فهد العتيبي',
    cityAr: 'مدينة الكويت',
    cityEn: 'Kuwait City',
    items: [
      { nameAr: 'هيل وقرفة', nameEn: 'Cardamom and cinnamon', qty: 1 },
      { nameAr: 'شاي أحمر', nameEn: 'Black tea', qty: 2 },
    ],
    status: 'delivered',
    totalAmount: 18.75,
    currency: 'KWD',
    eta: null,
    deliveredOn: '2026-10-09',
  },
  {
    orderId: 'WRD-12190',
    customerName: 'لينا حداد',
    cityAr: 'عمّان',
    cityEn: 'Amman',
    items: [{ nameAr: 'صابون غار', nameEn: 'Laurel soap', qty: 3 }],
    status: 'processing',
    totalAmount: 24,
    currency: 'JOD',
    eta: '2026-10-20',
    deliveredOn: null,
  },
]

export function findOrder(orderId: string): SampleOrder | undefined {
  const normalized = orderId.trim().toUpperCase()
  return SAMPLE_ORDERS.find((order) => order.orderId === normalized)
}

export function extractOrderId(text: string): string | null {
  return text.toUpperCase().match(/WRD-\d{4,}/)?.[0] ?? null
}
