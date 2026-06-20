'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'
import { BURST_COLORS } from '@/lib/motion'

interface HeartBurstProps {
  /** バーストの発火トリガ。お気に入り「追加」時に true にする */
  active: boolean
  /** 粒子数（8〜14） */
  count?: number
}

/**
 * ♥中心から朱・金・藍の粒子を放射する祭りバースト。
 * 親（FavoriteButton）の♥アイコンを relative にして、その上に absolute で重ねる想定。
 * transform / opacity のみ。reduced-motion 時は描画しない。
 */
export default function HeartBurst({ active, count = 12 }: HeartBurstProps) {
  const reduce = useReducedMotion()

  // 粒子の方向・距離・色を決定論的に算出（純粋関数。Math.random は使わない）。
  // 黄金角ベースで均等かつ自然に散らし、index 由来の擬似乱数で大きさ・遅延に変化を付ける。
  const particles = useMemo(() => {
    const n = Math.min(14, Math.max(8, count))
    const goldenAngle = 2.399963 // ≒ 137.5°（黄金角）
    return Array.from({ length: n }, (_, i) => {
      // 0..1 の決定論的擬似乱数（sin ハッシュ）
      const r = (k: number) => {
        const v = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453
        return v - Math.floor(v)
      }
      const angle = i * goldenAngle + (r(1) - 0.5) * 0.5
      const distance = 34 + r(2) * 30
      // 一部をキラ(白)に差し替えて祝祭感アップ
      const palette = [...BURST_COLORS, '#FFFFFF']
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: palette[i % palette.length],
        size: 5 + r(3) * 5,
        delay: r(4) * 0.05,
        rounded: i % 3 === 0, // 一部を紙吹雪風の角に
      }
    })
  }, [count])

  if (reduce) return null

  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      <AnimatePresence>
        {active && (
          <span key="burst" className="absolute">
            {particles.map((p) => (
              <motion.span
                key={p.id}
                className="absolute left-0 top-0 block"
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: p.rounded ? '2px' : '9999px',
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  scale: [0, 1, 0.4],
                  opacity: [1, 1, 0],
                  rotate: p.rounded ? 180 : 0,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.6,
                  delay: p.delay,
                  ease: 'easeOut',
                }}
              />
            ))}
          </span>
        )}
      </AnimatePresence>
    </span>
  )
}
