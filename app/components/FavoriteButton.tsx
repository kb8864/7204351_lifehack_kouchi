'use client'

import { useState, useEffect } from 'react'

interface FavoriteButtonProps {
  lifehackId: number
}

function getUid(): string | null {
  if (typeof document === 'undefined') return null
  return (
    document.cookie
      .split('; ')
      .find((c) => c.startsWith('shichifuku_uid='))
      ?.split('=')[1] ?? null
  )
}

export default function FavoriteButton({ lifehackId }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const uid = getUid()
    if (!uid) return
    fetch(`/api/favorites?lifehack_id=${lifehackId}&uid=${encodeURIComponent(uid)}`)
      .then((r) => r.json())
      .then((d) => setFavorited(d.favorited))
      .catch(() => {})
  }, [lifehackId])

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    const prev = favorited
    setFavorited(!prev) // 楽観的UI更新
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lifehack_id: lifehackId }),
      })
      const data = await res.json()
      if (!res.ok) setFavorited(prev) // 失敗時ロールバック
      else setFavorited(data.favorited)
    } catch {
      setFavorited(prev)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 active:scale-90 ${
        favorited
          ? 'bg-red-50 text-red-500 border border-red-200'
          : 'bg-[#F7F7F5] text-[#8E8E93] border border-[#E5E5EA] hover:border-red-200 hover:text-red-400'
      } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
      aria-label={favorited ? 'お気に入りから削除' : 'お気に入りに追加'}
    >
      <span className="text-base">{favorited ? '❤️' : '🤍'}</span>
      <span>{favorited ? 'お気に入り済み' : 'お気に入りに追加'}</span>
    </button>
  )
}
