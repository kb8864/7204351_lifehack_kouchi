'use client'

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import { useEffect } from 'react'

interface AnimatedCountProps {
  value: number
  className?: string
}

/**
 * 数字がロールアップ/ダウンしながら増減するカウンタ。
 * reduced-motion 時は即時に値を表示する。
 */
export default function AnimatedCount({ value, className }: AnimatedCountProps) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(value)
  const rounded = useTransform(mv, (v) => Math.round(v).toString())

  useEffect(() => {
    if (reduce) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, {
      duration: 0.5,
      ease: 'easeOut',
    })
    return () => controls.stop()
  }, [value, mv, reduce])

  return <motion.span className={className}>{rounded}</motion.span>
}
