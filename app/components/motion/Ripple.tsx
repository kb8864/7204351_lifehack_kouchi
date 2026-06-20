'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useState } from 'react'

interface RippleItem {
  id: number
  x: number
  y: number
  size: number
}

/**
 * タップ位置から朱(--primary)系の半透明円が広がる波紋。
 * useRipple() で pointerdown ハンドラと描画レイヤーを取得し、
 * overflow-hidden な要素（カード等）内に重ねて使う。
 *
 * - touch対応: pointerdown で発火（マウス/タッチ両対応）。
 * - 複数タップ対応: 配列で管理し、アニメ終了後に除去。
 * - ナビゲーション(Link)は妨げない（レイヤーは pointer-events-none）。
 * - reduced-motion 時は何も出さない。
 */
export function useRipple() {
  const reduce = useReducedMotion()
  const [ripples, setRipples] = useState<RippleItem[]>([])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (reduce) return
      const target = e.currentTarget
      const rect = target.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      // タップ点から最も遠い角までを半径に → カバー範囲を保証
      const maxX = Math.max(x, rect.width - x)
      const maxY = Math.max(y, rect.height - y)
      const radius = Math.hypot(maxX, maxY)
      const size = radius * 2
      const id =
        typeof performance !== 'undefined' ? performance.now() : Date.now()
      setRipples((prev) => [...prev, { id, x, y, size }])
    },
    [reduce],
  )

  const remove = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const rippleLayer = reduce ? null : (
    <span className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[inherit]">
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="absolute block rounded-full"
            style={{
              left: r.x,
              top: r.y,
              width: r.size,
              height: r.size,
              marginLeft: -r.size / 2,
              marginTop: -r.size / 2,
              backgroundColor: 'var(--primary)',
            }}
            initial={{ scale: 0, opacity: 0.32 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => remove(r.id)}
          />
        ))}
      </AnimatePresence>
    </span>
  )

  return { onPointerDown, rippleLayer }
}
