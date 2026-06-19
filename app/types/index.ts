export type Category = 'food' | 'costume_make' | 'other' | 'practice' | 'festival'

export interface Lifehack {
  id: number
  title: string | null
  description: string
  author: string | null
  link: string | null
  photo: string | null
  category: Category
  tags: string[]
  is_approved: boolean
  created_at: string
  favorite_count?: number
  is_favorited?: boolean
}

export interface User {
  id: string
  line_user_id: string
  display_name: string | null
  picture_url: string | null
  is_admin: boolean
  created_at: string
}

export interface SessionUser {
  id: string
  lineUserId: string
  displayName: string | null
  pictureUrl: string | null
  isAdmin: boolean
}

export interface RankingItem {
  lifehack_id: number
  view_count: number
  lifehack: Lifehack
}

export interface OGPData {
  imageUrl: string | null
  title: string | null
}

export interface CategoryInfo {
  label: string
  icon: string
  color: string
  bgColor: string
  borderColor: string
  image: string
}
