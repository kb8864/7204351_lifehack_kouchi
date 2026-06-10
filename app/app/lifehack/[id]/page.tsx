import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createServerClient } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { fetchOgpImage as fetchOGPImage } from '@/lib/ogp'
import { getLifehackById, SUPABASE_ID_OFFSET, getHiddenJsonIds } from '@/lib/data'
import { CATEGORIES, TAG_COLORS, DEFAULT_TAG_COLOR } from '@/lib/constants'
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

  const session = await getSession()

  // お気に入り情報とOGP画像を並列取得（Supabase失敗時はデフォルト値）
  let totalFavorites = 0
  let isFavorited = false
  let ogpImage: string | null = null

  try {
    const supabase = createServerClient()
    const [favCountResult, ogpResult, myFavResult] = await Promise.all([
      supabase.from('favorites').select('id', { count: 'exact' }).eq('lifehack_id', lifehackId),
      lifehack.link && !lifehack.photo ? fetchOGPImage(lifehack.link) : Promise.resolve(null),
      session
        ? supabase.from('favorites').select('id').eq('user_id', session.id).eq('lifehack_id', lifehackId).maybeSingle()
        : Promise.resolve({ data: null }),
    ])
    totalFavorites = favCountResult.data?.length ?? 0
    ogpImage = ogpResult
    isFavorited = !!myFavResult.data
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
      <nav className="flex items-center gap-2 text-sm text-[#8E8E93] mb-4">
        <Link href="/" className="hover:text-[#E85A2C]">ホーム</Link>
        <span>›</span>
        <Link href={`/${lifehack.category}`} className="hover:text-[#E85A2C]">
          {info.icon} {info.label}
        </Link>
      </nav>

      <article className="bg-white rounded-2xl shadow-sm border border-[#E5E5EA] overflow-hidden">
        {/* サムネイル */}
        {thumbnail && (
          <div className="relative w-full h-52 bg-[#F7F7F5]">
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
          <h1 className="text-xl font-bold text-[#1C1C1E] leading-snug">
            {lifehack.title || lifehack.description.slice(0, 40) + '…'}
          </h1>

          {/* 投稿者 */}
          {lifehack.author && (
            <p className="text-sm text-[#8E8E93]">
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
          <div className="text-[15px] text-[#1C1C1E] leading-relaxed whitespace-pre-wrap bg-[#F7F7F5] rounded-xl p-4">
            {lifehack.description}
          </div>

          {/* 商品リンク（httpで始まる正当なURLがある場合のみ表示） */}
          {lifehack.link?.startsWith('http') && (
            <div>
              <a
                href={lifehack.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-[#E85A2C] text-[#E85A2C] rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-[#FFF0EB] transition-colors"
              >
                <span>🔗</span>
                <span>関連リンクを見る</span>
                <span className="ml-auto">→</span>
              </a>
            </div>
          )}

          {/* お気に入り */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA]">
            <FavoriteButton
              lifehackId={lifehack.id}
              initialFavorited={isFavorited}
              initialCount={totalFavorites}
              isLoggedIn={!!session}
            />
            {!session && (
              <p className="text-xs text-[#8E8E93]">
                お気に入りにはLINEログインが必要です
              </p>
            )}
          </div>
        </div>
      </article>

      {/* 戻るリンク */}
      <div className="mt-4">
        <Link
          href={`/${lifehack.category}`}
          className="text-sm text-[#E85A2C] font-medium flex items-center gap-1"
        >
          ← {info.label}一覧に戻る
        </Link>
      </div>
    </div>
  )
}
