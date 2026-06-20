'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

interface RingPulseProps {
  /** 発火トリガ（選択のたびに再発火させるため、呼び出し側で key を変える） */
  active: boolean
  /** リング色（朱/金など） */
  color?: string
}

/**
 * 要素の外周から一度だけ広がって消えるリング。
 * 親を relative にして absolute inset-0 で重ねる想定（pointer-events-none）。
 * transform/opacity のみ。reduced-motion 時は描画しない。
 */
export default function RingPulse({
  active,
  color = 'var(--primary)',
}: RingPulseProps) {
  const reduce = useReducedMotion()
  if (reduce) return null

  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      <AnimatePresence>
        {active && (
          <motion.span
            key="ring"
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${color}` }}
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </span>
  )
}
