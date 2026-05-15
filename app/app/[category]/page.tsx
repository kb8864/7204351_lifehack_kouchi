import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase'
import { CATEGORIES, CATEGORY_SLUGS } from '@/lib/constants'
import { getSession } from '@/lib/auth'
import type { Category, Lifehack } from '@/types'
import LifehackCard from '@/components/LifehackCard'
import CategoryFilter from '@/components/CategoryFilter'

interface Props {
  params: Promise<{ category: string }>
  searchParams: Promise<{ tag?: string; q?: string }>
}

async function getLifehacks(
  category: Category,
  tag: string,
  query: string,
  userId: string | null
): Promise<Lifehack[]> {
  const supabase = createServerClient()

  let qb = supabase
    .from('lifehacks')
    .select(`
      *,
      favorite_count:favorites(count)
    `)
    .eq('category', category)
    .eq('is_approved', true)
    .order('created_at', { ascending: true })

  if (tag) qb = qb.contains('tags', [tag])
  if (query) qb = qb.ilike('description', `%${query}%`)

  const { data } = await qb

  // favorite_countをflatten
  const lifehacks: Lifehack[] = (data ?? []).map((row: Record<string, unknown>) => {
    const favArr = row.favorite_count as { count: number }[] | null
    return {
      ...row,
      favorite_count: favArr?.[0]?.count ?? 0,
    } as Lifehack
  })

  // ユーザーがお気に入りしているものを取得
  if (userId) {
    const ids = lifehacks.map((lh) => lh.id)
    const { data: favs } = await supabase
      .from('favorites')
      .select('lifehack_id')
      .eq('user_id', userId)
      .in('lifehack_id', ids)

    const favSet = new Set(favs?.map((f) => f.lifehack_id) ?? [])
    lifehacks.forEach((lh) => {
      lh.is_favorited = favSet.has(lh.id)
    })
  }

  return lifehacks
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category: categorySlug } = await params
  const { tag = '', q = '' } = await searchParams

  if (!CATEGORY_SLUGS.includes(categorySlug as Category)) {
    notFound()
  }

  const category = categorySlug as Category
  const info = CATEGORIES[category]
  const session = await getSession()

  const lifehacks = await getLifehacks(category, tag, q, session?.id ?? null)
  const allTags = [...new Set(lifehacks.flatMap((lh) => lh.tags))]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* ヘッダー */}
      <div className={`${info.bgColor} ${info.borderColor} border-2 rounded-2xl p-5`}>
        <div className="text-4xl mb-1">{info.icon}</div>
        <h1 className={`text-2xl font-bold ${info.color}`}>{info.label}</h1>
        <p className="text-sm text-[#8E8E93] mt-1">{lifehacks.length}件のライフハック</p>
      </div>

      {/* フィルター */}
      <Suspense>
        <CategoryFilter
          category={category}
          tags={allTags}
          activeTag={tag}
          searchQuery={q}
        />
      </Suspense>

      {/* 一覧 */}
      {lifehacks.length === 0 ? (
        <div className="text-center py-16 text-[#8E8E93]">
          <div className="text-4xl mb-3">🔍</div>
          <p>該当するライフハックが見つかりませんでした</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {lifehacks.map((lh) => (
            <LifehackCard key={lh.id} lifehack={lh} />
          ))}
        </div>
      )}
    </div>
  )
}

export async function generateStaticParams() {
  return CATEGORY_SLUGS.map((category) => ({ category }))
}
