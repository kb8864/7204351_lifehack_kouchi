'use client'

import { useEffect, useState } from 'react'
import type { Lifehack } from '@/types'
import LifehackCard from '@/components/LifehackCard'

const STORAGE_KEY = 'shichifuku_favorites'

export default function FavoritesPage() {
  const [lifehacks, setLifehacks] = useState<Lifehack[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ids: number[] = (() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      } catch {
        return []
      }
    })()

    if (ids.length === 0) {
      setLoading(false)
      return
    }

    fetch(`/api/lifehacks/batch?ids=${ids.join(',')}`)
      .then((r) => r.json())
      .then((data) => setLifehacks(data.lifehacks ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">❤️</span>
          <h1 className="text-xl font-bold text-[#1C1C1E]">お気に入り</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl overflow-hidden h-52 sk" />
          ))}
        </div>
      </div>
    )
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
          <a href="/" className="text-[#E85A2C] font-medium text-sm">
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
