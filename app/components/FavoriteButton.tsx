'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FavoriteButtonProps {
  lifehackId: number
  initialFavorited: boolean
  initialCount: number
}

export default function FavoriteButton({ lifehackId, initialFavorited, initialCount }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    const prevFavorited = favorited
    const prevCount = count
    // 楽観的更新
    setFavorited(!prevFavorited)
    setCount(prevFavorited ? prevCount - 1 : prevCount + 1)
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lifehack_id: lifehackId }),
      })
      const data = await res.json()
      if (!res.ok) {
        // 失敗時ロールバック
        setFavorited(prevFavorited)
        setCount(prevCount)
      } else {
        setFavorited(data.favorited)
        setCount(data.count)
        router.refresh()
      }
    } catch {
      setFavorited(prevFavorited)
      setCount(prevCount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-[color,transform,background-color] duration-200 active:scale-90 ${
        favorited
          ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]'
          : 'bg-[var(--background)] text-[var(--muted)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
      } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
      aria-label={favorited ? 'お気に入りから削除' : 'お気に入りに追加'}
    >
      <span className="text-base">{favorited ? '❤️' : '🤍'}</span>
      <span>{favorited ? 'お気に入り済み' : 'お気に入りに追加'}</span>
      {count > 0 && (
        <span className="text-xs font-normal opacity-75">{count}</span>
      )}
    </button>
  )
}
