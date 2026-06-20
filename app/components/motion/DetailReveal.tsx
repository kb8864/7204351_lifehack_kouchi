'use client'

import { motion, useReducedMotion } from 'motion/react'
import { Children, type ReactNode } from 'react'
import { detailContainer, detailItem, fadeOnly } from '@/lib/motion'

interface DetailRevealProps {
  children: ReactNode
  className?: string
}

/**
 * server で組み立てた children（プレーンな要素群）を client 境界でラップし、
 * 各トップレベル子要素を stagger で段階表示する。
 * children は server 由来でよい（合成パターン）。
 * reduced-motion 時はフェードのみへ縮退。
 */
export default function DetailReveal({ children, className }: DetailRevealProps) {
  const reduce = useReducedMotion()
  const item = reduce ? fadeOnly : detailItem
  const items = Children.toArray(children)

  return (
    <motion.div
      className={className}
      variants={detailContainer}
      initial="hidden"
      animate="show"
    >
      {items.map((child, i) => (
        <motion.div key={i} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
