import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { createServerClient } from '@/lib/supabase'
import { fetchOgpImage as fetchOGPImage } from '@/lib/ogp'
import { getLifehackById, SUPABASE_ID_OFFSET, getHiddenJsonIds } from '@/lib/data'
import { getPlacements, getTagOverrides, applyOverridesToOne } from '@/lib/overrides'
import { CATEGORIES, TAG_COLORS, DEFAULT_TAG_COLOR } from '@/lib/constants'
import type { Category } from '@/types'
import FavoriteButton from '@/components/FavoriteButton'

interface Props {
  params: Promise<{ id: string }>
}

async function recordView(lifehackId: number) {
  try {
    const supabase = createServerClient()
    await supabase.from('views').insert({ lifehack_id: lifehackId })
  } catch {
    // Supabase未設定でも無視
  }
}

export default async function LifehackDetailPage({ params }: Props) {
  const { id } = await params
  const lifehackId = parseInt(id, 10)
  if (isNaN(lifehackId)) notFound()

  // JSON IDの場合、非表示チェック
  let lifehack = getLifehackById(lifehackId)
  if (lifehack) {
    const hiddenIds = await getHiddenJsonIds()
    if (hiddenIds.has(lifehackId)) notFound()
  }

  // id > SUPABASE_ID_OFFSET の場合はSupabaseから取得
  if (!lifehack && lifehackId > SUPABASE_ID_OFFSET) {
    try {
      const { createServerClient } = await import('@/lib/supabase')
      const supabase = createServerClient()
      const { data } = await supabase
        .from('lifehacks')
        .select('*')
        .eq('id', lifehackId - SUPABASE_ID_OFFSET)
        .eq('is_approved', true)
        .maybeSingle()
      if (data) {
        lifehack = {
          id: lifehackId,
          title: data.title,
          description: data.description,
          author: data.author,
          link: data.link,
          photo: data.photo,
          category: data.category,
          tags: data.tags ?? [],
          is_approved: true,
          created_at: data.created_at,
          favorite_count: 0,
          is_favorited: false,
        }
      }
    } catch {
      // Supabase未設定でも続行
    }
  }
  if (!lifehack) notFound()

  // タグ上書き・所属カテゴリ（複数）を適用（基調色 lh.category は維持）
  const [placements, tagOv] = await Promise.all([getPlacements(), getTagOverrides()])
  lifehack = applyOverridesToOne(lifehack, placements, tagOv)
  const memberCategories: Category[] = (lifehack.categories ?? [lifehack.category])

  // uid を Cookie から読む
  const cookieStore = await cookies()
  const uid = cookieStore.get('shichifuku_uid')?.value

  // お気に入り数・ユーザーのお気に入り状態・OGP画像を並列取得（Supabase失敗時はデフォルト値）
  let totalFavorites = 0
  let initialFavorited = false
  let ogpImage: string | null = null

  try {
    const supabase = createServerClient()
    const [favCountResult, favUserResult, ogpResult] = await Promise.all([
      supabase
        .from('anonymous_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('lifehack_id', lifehackId),
      uid
        ? supabase
            .from('anonymous_favorites')
            .select('uid')
            .eq('uid', uid)
            .eq('lifehack_id', lifehackId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      lifehack.link && !lifehack.photo ? fetchOGPImage(lifehack.link) : Promise.resolve(null),
    ])
    totalFavorites = favCountResult.count ?? 0
    initialFavorited = !!(favUserResult.data)
    ogpImage = ogpResult
  } catch {
    if (lifehack.link && !lifehack.photo) {
      ogpImage = await fetchOGPImage(lifehack.link).catch(() => null)
    }
  }

  // 閲覧数を記録（fire and forget）
  recordView(lifehackId).catch(() => {})

  const info = CATEGORIES[lifehack.category]
  const thumbnail = lifehack.photo || ogpImage

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* パンくず */}
      <nav className="flex items-center gap-2 text-sm text-[var(--muted)] mb-4">
        <Link href="/" className="hover:text-[var(--primary)]">ホーム</Link>
        <span>›</span>
        <Link href={`/${lifehack.category}`} className="hover:text-[var(--primary)]">
          {info.icon} {info.label}
        </Link>
      </nav>

      {/* 所属カテゴリチップ（複数カテゴリにまたがる場合に表示） */}
      {memberCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {memberCategories.map((cat) => {
            const catInfo = CATEGORIES[cat]
            if (!catInfo) return null
            return (
              <Link
                key={cat}
                href={`/${cat}`}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${catInfo.bgColor} ${catInfo.borderColor} ${catInfo.color} hover:opacity-80`}
              >
                <span>{catInfo.icon}</span>
                <span>{catInfo.label}</span>
              </Link>
            )
          })}
        </div>
      )}

      <article className="glass-card rounded-2xl shadow-sm overflow-hidden">
        {/* のれん風の朱色帯 */}
        <div className="noren-bar h-1 w-full" />
        {/* サムネイル */}
        {thumbnail && (
          <div className="relative w-full h-52 bg-[var(--background)]">
            <Image
              src={thumbnail}
              alt={lifehack.title || 'ライフハック'}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* タイトル */}
          <h1 className="font-wa text-xl font-bold text-[var(--foreground)] leading-snug">
            {lifehack.title || lifehack.description.slice(0, 40) + '…'}
          </h1>

          {/* 投稿者 */}
          {lifehack.author && (
            <p className="text-sm text-[var(--muted)]">
              💬 {lifehack.author}
            </p>
          )}

          {/* タグ */}
          <div className="flex flex-wrap gap-1.5">
            {lifehack.tags.map((tag) => (
              <span
                key={tag}
                className={`text-xs text-white px-2 py-0.5 rounded-full ${TAG_COLORS[tag] || DEFAULT_TAG_COLOR}`}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 本文 */}
          <div className="text-[15px] text-[var(--foreground)] leading-relaxed whitespace-pre-wrap bg-[var(--background)] border border-[var(--border)] rounded-xl p-4">
            {lifehack.description}
          </div>

          {/* 商品リンク（httpで始まる正当なURLがある場合のみ表示） */}
          {lifehack.link?.startsWith('http') && (
            <div>
              <a
                href={lifehack.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-[var(--primary)] text-[var(--primary)] rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-[var(--primary-light)] transition-colors"
              >
                <span>🔗</span>
                <span>関連リンクを見る</span>
                <span className="ml-auto">→</span>
              </a>
            </div>
          )}

          {/* お気に入り */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <FavoriteButton lifehackId={lifehack.id} initialFavorited={initialFavorited} initialCount={totalFavorites} />
            <span className="text-xs text-[var(--muted)]">
              {totalFavorites > 0 ? `${totalFavorites}人がお気に入り` : ''}
            </span>
          </div>
        </div>
      </article>

      {/* 戻るリンク */}
      <div className="mt-4">
        <Link
          href={`/${lifehack.category}`}
          className="text-sm text-[var(--primary)] font-medium flex items-center gap-1"
        >
          ← {info.label}一覧に戻る
        </Link>
      </div>
    </div>
  )
}
