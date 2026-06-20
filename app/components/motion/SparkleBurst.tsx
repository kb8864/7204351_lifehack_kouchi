'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'

interface SparkleBurstProps {
  /** 発火トリガ（再発火は呼び出し側で key を変える） */
  active: boolean
  /** 粒子数 */
  count?: number
  /** 粒子色（順番にサイクル） */
  colors?: readonly string[]
  /** 飛距離スケール（px の基準） */
  spread?: number
  /** 粒子サイズの基準(px) */
  baseSize?: number
  /** 再生時間(s) */
  duration?: number
}

/**
 * 中心から金/朱のキラ粒子を放射する汎用バースト（HeartBurst の一般化）。
 * 親を relative にし、absolute inset-0 で重ねる（pointer-events-none）。
 * 方向・距離は黄金角＋sinハッシュで決定論的（Math.random 不使用）。
 * transform/opacity のみ。reduced-motion 時は描画しない。
 */
export default function SparkleBurst({
  active,
  count = 6,
  colors = ['#C9A227', '#C73E3A', '#D9B441'],
  spread = 22,
  baseSize = 4,
  duration = 0.5,
}: SparkleBurstProps) {
  const reduce = useReducedMotion()

  const particles = useMemo(() => {
    const n = Math.max(1, count)
    const goldenAngle = 2.399963
    return Array.from({ length: n }, (_, i) => {
      const r = (k: number) => {
        const v = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453
        return v - Math.floor(v)
      }
      const angle = i * goldenAngle + (r(1) - 0.5) * 0.5
      const distance = spread * (0.7 + r(2) * 0.7)
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: colors[i % colors.length],
        size: baseSize + r(3) * baseSize,
        delay: r(4) * 0.05,
        rounded: i % 3 === 0,
      }
    })
  }, [count, colors, spread, baseSize])

  if (reduce) return null

  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      <AnimatePresence>
        {active && (
          <span key="sparkle" className="absolute">
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
                  rotate: p.rounded ? 160 : 0,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration, delay: p.delay, ease: 'easeOut' }}
              />
            ))}
          </span>
        )}
      </AnimatePresence>
    </span>
  )
}
