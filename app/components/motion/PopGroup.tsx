'use client'

import { motion, useReducedMotion } from 'motion/react'
import { Children, type ReactNode } from 'react'
import { chipPop, fadeOnly } from '@/lib/motion'

interface PopGroupProps {
  children: ReactNode
  className?: string
}

/**
 * 子要素を順にポップインさせる stagger コンテナ（所属カテゴリチップ群など）。
 * reduced-motion 時はフェードのみ。
 */
export default function PopGroup({ children, className }: PopGroupProps) {
  const reduce = useReducedMotion()
  const item = reduce ? fadeOnly : chipPop
  const items = Children.toArray(children)

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {items.map((child, i) => (
        <motion.div key={i} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
