export const revalidate = 60

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CATEGORIES, CATEGORY_SLUGS } from '@/lib/constants'
import { getCategoryListing } from '@/lib/data'
import { getOgpImageMap } from '@/lib/ogp'
import { getFavoriteCounts } from '@/lib/favorites'
import type { Category, Lifehack } from '@/types'
import CategoryBrowser from '@/components/CategoryBrowser'

interface Props {
  params: Promise<{ category: string }>
}

async function getLifehacks(category: Category): Promise<Lifehack[]> {
  // 配置(複数カテゴリ所属/並び順)・タグ上書きを反映した順序付き一覧
  let lifehacks = await getCategoryListing(category)

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

export default async function CategoryPage({ params }: Props) {
  const { category: categorySlug } = await params

  if (!CATEGORY_SLUGS.includes(categorySlug as Category)) {
    notFound()
  }

  const category = categorySlug as Category
  const info = CATEGORIES[category]

  const lifehacks = await getLifehacks(category)
  const ogpMap = await getOgpImageMap(lifehacks)

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

      {/* クライアントサイドフィルター + 一覧 */}
      <Suspense>
        <CategoryBrowser
          category={category}
          lifehacks={lifehacks}
          ogpMap={ogpMap}
        />
      </Suspense>
    </div>
  )
}

export async function generateStaticParams() {
  return CATEGORY_SLUGS.map((category) => ({ category }))
}
