'use client'

import { useState } from 'react'

interface FavoriteButtonProps {
  lifehackId: number
  initialFavorited: boolean
  initialCount: number
  isLoggedIn: boolean
}

export default function FavoriteButton({
  lifehackId,
  initialFavorited,
  initialCount,
  isLoggedIn,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!isLoggedIn) {
      window.location.href = '/api/auth/line'
      return
    }
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lifehack_id: lifehackId }),
      })
      const data = await res.json()
      if (res.ok) {
        setFavorited(data.favorited)
        setCount((prev) => prev + (data.favorited ? 1 : -1))
      } else {
        alert('お気に入りの登録に失敗しました。しばらくしてから再試行してください。')
      }
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
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-95'}`}
      aria-label={favorited ? 'お気に入りから削除' : 'お気に入りに追加'}
    >
      <span className="text-base">{favorited ? '❤️' : '🤍'}</span>
      <span>{count}</span>
    </button>
  )
}
