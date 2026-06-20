'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'

interface FlyingHeartsProps {
  /** 発火トリガ（お気に入り「追加」時。再発火は呼び出し側で key を変える） */
  active: boolean
}

/**
 * お気に入り追加時に、大きなハートが舞い上がり、
 * さらに複数の小さなハートが立ち上って消える祝祭演出。
 * 親(ボタン)を relative にし、absolute で重ねる（pointer-events-none、overflow非クリップ）。
 * transform/opacity のみ。reduced-motion 時は描画しない。
 */
export default function FlyingHearts({ active }: FlyingHeartsProps) {
  const reduce = useReducedMotion()

  // 小さなハート群（左右に散らしつつ上昇）。決定論的に配置。
  const minis = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const r = (k: number) => {
        const v = Math.sin((i + 1) * 24.17 + k * 91.3) * 43758.5453
        return v - Math.floor(v)
      }
      return {
        id: i,
        x: (r(1) - 0.5) * 56, // 横ぶれ
        rise: 46 + r(2) * 34, // 上昇量
        size: 11 + r(3) * 8,
        delay: r(4) * 0.12,
        rotate: (r(5) - 0.5) * 40,
      }
    })
  }, [])

  if (reduce) return null

  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      <AnimatePresence>
        {active && (
          <span key="fly" className="absolute">
            {/* 大きなハートが上方へ舞い上がる */}
            <motion.span
              className="absolute left-0 top-0 block text-2xl"
              style={{ marginLeft: -12, marginTop: -12 }}
              initial={{ y: 0, scale: 0.4, opacity: 0 }}
              animate={{
                y: [-2, -64],
                scale: [0.4, 1.3, 1.05],
                opacity: [0, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              ❤️
            </motion.span>

            {/* 複数の小さなハートが立ち上る */}
            {minis.map((m) => (
              <motion.span
                key={m.id}
                className="absolute left-0 top-0 block"
                style={{ fontSize: m.size, marginLeft: -m.size / 2, marginTop: -m.size / 2 }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{
                  x: m.x,
                  y: -m.rise,
                  scale: [0, 1, 0.8],
                  opacity: [0, 1, 0],
                  rotate: m.rotate,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.85, delay: m.delay, ease: 'easeOut' }}
              >
                ❤️
              </motion.span>
            ))}
          </span>
        )}
      </AnimatePresence>
    </span>
  )
}
