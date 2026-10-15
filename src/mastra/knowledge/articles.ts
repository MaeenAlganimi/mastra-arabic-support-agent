export type FaqArticle = {
  id: string
  titleAr: string
  titleEn: string
  keywords: string
  answerAr: string
  answerEn: string
}

/**
 * Sample knowledge base for Bayt Wardi, a fictional pantry and home shop.
 * Write your own policies here. Retrieval embeds `keywords` plus the answer
 * so dialectal questions still land on the right note.
 */
export const FAQ_ARTICLES: FaqArticle[] = [
  {
    id: 'shipping',
    titleAr: 'مدة التوصيل',
    titleEn: 'Shipping time',
    keywords: 'شحن توصيل مدة أيام يوصل بياخد قد ايه delivery shipping how long arrive متى يوصل',
    answerAr: 'التوصيل داخل المدينة من 2 إلى 5 أيام عمل، وبين المدن من 3 إلى 7 أيام عمل.',
    answerEn: 'Shipping takes 2 to 5 business days inside the city, and 3 to 7 business days between cities.',
  },
  {
    id: 'returns',
    titleAr: 'الإرجاع',
    titleEn: 'Returns',
    keywords: 'إرجاع استرجاع ترجيع نرجع ارجع مرتجع return refund سياسة خلال',
    answerAr: 'يمكن إرجاع منتج غير مفتوح خلال 14 يوماً من التسليم، مع رقم الطلب.',
    answerEn: 'Unopened items can be returned within 14 days of delivery when you share the order id.',
  },
  {
    id: 'payment',
    titleAr: 'طرق الدفع',
    titleEn: 'Payment',
    keywords: 'دفع كاش عند الاستلام بطاقة فيزا payment cod cash card',
    answerAr: 'الدفع المتاح هو البطاقة أو الدفع عند الاستلام. لا نطلب رقم البطاقة في المحادثة.',
    answerEn: 'You can pay by card or cash on delivery. Never share a card number in chat.',
  },
  {
    id: 'damaged',
    titleAr: 'طلب تالف',
    titleEn: 'Damaged items',
    keywords: 'تالف مكسور عطل damaged broken jar سياسة ماذا افعل',
    answerAr: 'إذا وصل منتج تالفاً، صوّر الطرد خلال 48 ساعة ونفتح لك طلباً بديلاً أو إرجاعاً.',
    answerEn: 'If an item arrives damaged, send a photo within 48 hours and we open a replacement or return.',
  },
  {
    id: 'ramadan',
    titleAr: 'أوقات رمضان',
    titleEn: 'Ramadan hours',
    keywords: 'رمضان دوام ساعات عمل hours open close مواعيد',
    answerAr: 'في رمضان يرد الدعم من 10:00 إلى 16:00 ومن 20:00 إلى 23:00 بتوقيت طرابلس.',
    answerEn: 'During Ramadan, support replies from 10:00 to 16:00 and from 20:00 to 23:00 Tripoli time.',
  },
  {
    id: 'address',
    titleAr: 'تغيير العنوان',
    titleEn: 'Change address',
    keywords: 'عنوان تغيير عنوان address change توصيل لعنوان',
    answerAr: 'تغيير العنوان ممكن قبل خروج الطلب للتوصيل، ويحتاج رقم الطلب والعنوان الجديد.',
    answerEn: 'The address can change before the order leaves for delivery. Send the order id and the new address.',
  },
  {
    id: 'tracking',
    titleAr: 'تتبع الطلب',
    titleEn: 'Tracking',
    keywords: 'تتبع رقم الطلب tracking status حالة وين فين',
    answerAr: 'لتتبع الطلب نحتاج الرقم الذي يبدأ بـ WRD. من دونه لا نعرض حالة.',
    answerEn: 'Tracking needs the order id that starts with WRD. Without it we do not show a status.',
  },
  {
    id: 'human',
    titleAr: 'التحويل لموظف',
    titleEn: 'Human handoff',
    keywords: 'موظف بشري human agent تحويل محادثة شخص',
    answerAr: 'إذا طلبت موظفاً نفتح متابعة ونضعك في دور الدعم البشري في نفس اليوم.',
    answerEn: 'If you ask for a person, we open a follow-up and place you in the human queue the same day.',
  },
]
