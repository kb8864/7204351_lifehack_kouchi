import type { Category, CategoryInfo } from '@/types'

export const CATEGORIES: Record<Category, CategoryInfo> = {
  food: {
    label: '食事',
    icon: '🥢',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    image: '/images/food.jpg',
  },
costume_make: {
    label: '衣装・メイク',
    icon: '👘',
    color: 'text-indigo-800',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    image: '/images/costume_make.jpg',
  },
  other: {
    label: 'その他',
    icon: '📦',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    image: '/images/other.jpg',
  },
}

export const CATEGORY_SLUGS = Object.keys(CATEGORIES) as Category[]

// 和の伝統色を意識したタグ配色（朱・紺藍・金・抹茶・藤 などのトーン）
export const TAG_COLORS: Record<string, string> = {
  // 食事
  '熱中症対策': 'bg-red-700',
  'ご飯': 'bg-orange-600',
  '飲み物': 'bg-sky-700',
  '疲労回復': 'bg-emerald-700',
  // 体調管理
  '朝の準備': 'bg-amber-600',
  'のど飴': 'bg-purple-700',
  '演舞中': 'bg-indigo-700',
  // 衣装・メイク
  '雨対策': 'bg-blue-700',
  '足袋': 'bg-stone-600',
  '鳴子': 'bg-amber-700',
  'メイク': 'bg-rose-600',
  '髪型': 'bg-pink-700',
  // その他
  '高知市情報': 'bg-teal-700',
  'おすすめグッズ': 'bg-violet-700',
  'バス': 'bg-slate-600',
  '洗濯': 'bg-cyan-700',
  '豆知識': 'bg-green-700',
  '遅刻': 'bg-red-600',
  'BBQ': 'bg-orange-700',
}

export const DEFAULT_TAG_COLOR = 'bg-stone-500'

export const COOKIE_NAME = 'shichifuku_session'
export const SESSION_DURATION = 60 * 60 * 24 * 365 // 365 days in seconds
