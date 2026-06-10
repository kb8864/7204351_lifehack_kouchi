'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'shichifuku_favorites'

function getStoredIds(): number[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

interface FavoriteButtonProps {
  lifehackId: number
}

export default function FavoriteButton({ lifehackId }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(false)

  useEffect(() => {
    setFavorited(getStoredIds().includes(lifehackId))
  }, [lifehackId])

  const handleClick = () => {
    const ids = getStoredIds()
    let updated: number[]
    if (ids.includes(lifehackId)) {
      updated = ids.filter((id) => id !== lifehackId)
      setFavorited(false)
    } else {
      updated = [...ids, lifehackId]
      setFavorited(true)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 active:scale-90 ${
        favorited
          ? 'bg-red-50 text-red-500 border border-red-200'
          : 'bg-[#F7F7F5] text-[#8E8E93] border border-[#E5E5EA] hover:border-red-200 hover:text-red-400'
      }`}
      aria-label={favorited ? 'お気に入りから削除' : 'お気に入りに追加'}
    >
      <span className="text-base">{favorited ? '❤️' : '🤍'}</span>
      <span>{favorited ? 'お気に入り済み' : 'お気に入りに追加'}</span>
    </button>
  )
}
