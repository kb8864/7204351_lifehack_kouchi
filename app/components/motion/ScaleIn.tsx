'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { fadeOnly, heroReveal } from '@/lib/motion'

interface ScaleInProps {
  children: ReactNode
  className?: string
}

/**
 * 子（ヒーロー画像など）をスケールインさせる client ラッパ。
 * overflow-hidden は呼び出し側で付与する想定。
 * reduced-motion 時はフェードのみ。
 */
export default function ScaleIn({ children, className }: ScaleInProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={reduce ? fadeOnly : heroReveal}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  )
}
