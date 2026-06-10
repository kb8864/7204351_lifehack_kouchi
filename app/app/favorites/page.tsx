import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'
import { getLifehackByDisplayId } from '@/lib/data'
import { getFavoriteCounts } from '@/lib/favorites'
import type { Lifehack } from '@/types'
import LifehackCard from '@/components/LifehackCard'

export default async function FavoritesPage() {
  const cookieStore = await cookies()
  const uid = cookieStore.get('shichifuku_uid')?.value

  let lifehacks: Lifehack[] = []

  if (uid) {
    const supabase = createServerClient()
    const { data: favs } = await supabase
      .from('anonymous_favorites')
      .select('lifehack_id')
      .eq('uid', uid)
      .order('created_at', { ascending: false })

    lifehacks = (
      await Promise.all((favs ?? []).map((f) => getLifehackByDisplayId(f.lifehack_id)))
    ).filter((lh): lh is Lifehack => lh !== null)

    // お気に入り数をオーバーレイ
    if (lifehacks.length > 0) {
      const ids = lifehacks.map((lh) => lh.id)
      const countMap = await getFavoriteCounts(ids)
      lifehacks = lifehacks.map((lh) => ({
        ...lh,
        favorite_count: countMap[lh.id] ?? 0,
      }))
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-3xl">❤️</span>
        <div>
          <h1 className="font-wa text-xl font-bold text-[var(--foreground)]">お気に入り</h1>
          <p className="text-sm text-[var(--muted)]">{lifehacks.length}件</p>
        </div>
      </div>

      {lifehacks.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <div className="text-4xl mb-3">🤍</div>
          <p className="mb-4">お気に入りがまだありません</p>
          <a href="/" className="text-[var(--primary)] font-medium text-sm">
            ライフハックを探してみる →
          </a>
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
