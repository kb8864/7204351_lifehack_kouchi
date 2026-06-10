export const revalidate = 60

import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { CATEGORIES, CATEGORY_SLUGS } from '@/lib/constants'
import { getLifehacksByCategory, searchLifehacks, getSupabaseLifehacks, getHiddenJsonIds } from '@/lib/data'
import { getOgpImageMap } from '@/lib/ogp'
import { getFavoriteCounts } from '@/lib/favorites'
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
  query: string
): Promise<Lifehack[]> {
  const hiddenIds = await getHiddenJsonIds()

  // JSONから取得してフィルタリング（非表示を除外）
  let jsonLifehacks = (query
    ? searchLifehacks(query, category)
    : getLifehacksByCategory(category)
  ).filter((lh) => !hiddenIds.has(lh.id))

  if (tag) {
    jsonLifehacks = jsonLifehacks.filter((lh) => lh.tags.includes(tag))
  }

  // Supabaseからフォーム投稿データを取得してマージ
  let supabaseLifehacks = await getSupabaseLifehacks(category)
  if (tag) {
    supabaseLifehacks = supabaseLifehacks.filter((lh) => lh.tags.includes(tag))
  }
  if (query) {
    const q = query.toLowerCase()
    supabaseLifehacks = supabaseLifehacks.filter(
      (lh) =>
        lh.description.toLowerCase().includes(q) ||
        (lh.title?.toLowerCase().includes(q))
    )
  }

  let lifehacks = [...jsonLifehacks, ...supabaseLifehacks]

  // Supabaseからお気に入り情報をオーバーレイ（失敗しても続行）
  try {
    const ids = lifehacks.map((lh) => lh.id)
    const countMap = await getFavoriteCounts(ids)
    lifehacks = lifehacks.map((lh) => ({
      ...lh,
      favorite_count: countMap[lh.id] ?? 0,
    }))
  } catch {
    // Supabase未設定でも表示は継続
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

  const lifehacks = await getLifehacks(category, tag, q)
  const ogpMap = await getOgpImageMap(lifehacks)
  const allTags = [...new Set(lifehacks.flatMap((lh) => lh.tags))]

  const otherCategories = (Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][])
    .filter(([slug]) => slug !== category)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* パンくず */}
      <nav className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
        <Link href="/" className="hover:text-[var(--primary)] transition-colors">ホーム</Link>
        <span>›</span>
        <span className={info.color}>{info.icon} {info.label}</span>
      </nav>

      {/* ヘッダー */}
      <div className={`glass-card rounded-2xl overflow-hidden`}>
        {/* のれん風の朱色帯 */}
        <div className="noren-bar h-1 w-full" />
        <div className={`${info.bgColor} border-b ${info.borderColor} px-5 pt-5 pb-4`}>
          <div className="text-5xl mb-2">{info.icon}</div>
          <h1 className={`font-wa text-2xl font-extrabold ${info.color}`}>{info.label}</h1>
          <p className="text-sm text-[var(--muted)] mt-1">{lifehacks.length}件のライフハック</p>
        </div>
      </div>

      {/* 他カテゴリへの動線 */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {otherCategories.map(([slug, cat]) => (
          <Link
            key={slug}
            href={`/${slug}`}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-sm font-medium transition-colors ${cat.bgColor} ${cat.borderColor} ${cat.color}`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </Link>
        ))}
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
        <div className="text-center py-16 text-[var(--muted)]">
          <div className="text-4xl mb-3">🔍</div>
          <p>該当するライフハックが見つかりませんでした</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {lifehacks.map((lh) => (
            <LifehackCard key={lh.id} lifehack={lh} ogpImageUrl={ogpMap[lh.id] ?? null} />
          ))}
        </div>
      )}
    </div>
  )
}

export async function generateStaticParams() {
  return CATEGORY_SLUGS.map((category) => ({ category }))
}
