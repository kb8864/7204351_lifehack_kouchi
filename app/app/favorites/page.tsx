import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import type { Lifehack } from '@/types'
import LifehackCard from '@/components/LifehackCard'

export default async function FavoritesPage() {
  const session = await getSession()
  if (!session) redirect('/api/auth/line')

  const supabase = createServerClient()
  const { data: favs } = await supabase
    .from('favorites')
    .select('lifehack_id')
    .eq('user_id', session.id)

  const ids = favs?.map((f) => f.lifehack_id) ?? []

  let lifehacks: Lifehack[] = []
  if (ids.length > 0) {
    const { data } = await supabase
      .from('lifehacks')
      .select('*')
      .in('id', ids)
      .eq('is_approved', true)
    lifehacks = (data as Lifehack[]) ?? []
    lifehacks.forEach((lh) => { lh.is_favorited = true })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-3xl">❤️</span>
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1E]">お気に入り</h1>
          <p className="text-sm text-[#8E8E93]">{lifehacks.length}件</p>
        </div>
      </div>

      {lifehacks.length === 0 ? (
        <div className="text-center py-16 text-[#8E8E93]">
          <div className="text-4xl mb-3">🤍</div>
          <p className="mb-4">お気に入りがまだありません</p>
          <a
            href="/"
            className="text-[#E85A2C] font-medium text-sm"
          >
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
