'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import HeartBurst from '@/components/motion/HeartBurst'
import FlyingHearts from '@/components/motion/FlyingHearts'
import AnimatedCount from '@/components/motion/AnimatedCount'
import { springBouncy } from '@/lib/motion'

interface FavoriteButtonProps {
  lifehackId: number
  initialFavorited: boolean
  initialCount: number
}

export default function FavoriteButton({ lifehackId, initialFavorited, initialCount }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  // バースト再生キー（追加のたびにインクリメントして AnimatePresence を再発火）
  const [burstKey, setBurstKey] = useState(0)
  const [bursting, setBursting] = useState(false)
  const reduce = useReducedMotion()
  const router = useRouter()

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    const prevFavorited = favorited
    const prevCount = count
    // 楽観的更新
    const nextFavorited = !prevFavorited
    setFavorited(nextFavorited)
    setCount(prevFavorited ? prevCount - 1 : prevCount + 1)
    // 追加時のみ祭りバースト
    if (nextFavorited && !reduce) {
      setBurstKey((k) => k + 1)
      setBursting(true)
      window.setTimeout(() => setBursting(false), 1100)
    }
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lifehack_id: lifehackId }),
      })
      const data = await res.json()
      if (!res.ok) {
        // 失敗時ロールバック（演出も戻す）
        setFavorited(prevFavorited)
        setCount(prevCount)
        setBursting(false)
      } else {
        setFavorited(data.favorited)
        setCount(data.count)
        router.refresh()
      }
    } catch {
      setFavorited(prevFavorited)
      setCount(prevCount)
      setBursting(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={loading}
      whileTap={reduce ? undefined : { scale: 0.92 }}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-[color,background-color] duration-200 ${
        favorited
          ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]'
          : 'bg-[var(--background)] text-[var(--muted)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
      } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
      aria-label={favorited ? 'お気に入りから削除' : 'お気に入りに追加'}
    >
      <span className="relative inline-flex items-center justify-center">
        {/* 放射グロー（追加の瞬間に一閃） */}
        {!reduce && (
          <motion.span
            key={`glow-${burstKey}`}
            className="pointer-events-none absolute z-0 block rounded-full"
            style={{
              width: 40,
              height: 40,
              background:
                'radial-gradient(circle, rgba(201,162,39,0.55) 0%, rgba(199,62,58,0.35) 45%, rgba(199,62,58,0) 70%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={bursting ? { scale: [0.3, 1.8], opacity: [0.9, 0] } : { scale: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
        <motion.span
          key={favorited ? 'on' : 'off'}
          className="relative z-10 text-base"
          initial={reduce ? false : { scale: 0.6 }}
          animate={{ scale: favorited && !reduce ? [1, 1.7, 1] : 1 }}
          transition={
            favorited && !reduce
              ? { duration: 0.5, times: [0, 0.45, 1], ease: 'easeOut' }
              : springBouncy
          }
        >
          {favorited ? '❤️' : '🤍'}
        </motion.span>
        {/* 中心から放射する朱・金・藍＋キラの粒子（強化：数・距離アップ） */}
        <HeartBurst key={burstKey} active={bursting} count={14} />
      </span>
      <span>{favorited ? 'お気に入り済み' : 'お気に入りに追加'}</span>
      {count > 0 && (
        <AnimatedCount value={count} className="text-xs font-normal opacity-75" />
      )}
      {/* ボタン基準で舞い上がる大小のハート（クリップされないよう overflow非依存で重ねる） */}
      <FlyingHearts key={`fly-${burstKey}`} active={bursting} />
    </motion.button>
  )
}
