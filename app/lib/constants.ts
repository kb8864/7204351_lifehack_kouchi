import type { Category, CategoryInfo } from '@/types'

export const CATEGORIES: Record<Category, CategoryInfo> = {
  food: {
    label: '食事',
    icon: '🥢',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    image: '/images/food.jpg',
  },
costume_make: {
    label: '衣装・メイク',
    icon: '👘',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    image: '/images/costume_make.jpg',
  },
  other: {
    label: 'その他',
    icon: '📦',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    image: '/images/other.jpg',
  },
}

export const CATEGORY_SLUGS = Object.keys(CATEGORIES) as Category[]

export const TAG_COLORS: Record<string, string> = {
  // 食事
  '熱中症対策': 'bg-red-500',
  'ご飯': 'bg-orange-400',
  '飲み物': 'bg-sky-400',
  '疲労回復': 'bg-green-500',
  // 体調管理
  '朝の準備': 'bg-yellow-400',
  'のど飴': 'bg-purple-400',
  '演舞中': 'bg-indigo-400',
  // 衣装・メイク
  '雨対策': 'bg-blue-400',
  '足袋': 'bg-stone-400',
  '鳴子': 'bg-amber-500',
  'メイク': 'bg-pink-400',
  '髪型': 'bg-rose-400',
  // その他
  '高知市情報': 'bg-teal-500',
  'おすすめグッズ': 'bg-violet-400',
  'バス': 'bg-slate-400',
  '洗濯': 'bg-cyan-400',
  '豆知識': 'bg-emerald-400',
  '遅刻': 'bg-red-400',
  'BBQ': 'bg-orange-500',
}

export const DEFAULT_TAG_COLOR = 'bg-gray-400'

export const COOKIE_NAME = 'shichifuku_session'
export const SESSION_DURATION = 60 * 60 * 24 * 365 // 365 days in seconds
