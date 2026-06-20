'use client'

import { motion, useReducedMotion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  variants: Variants
  reducedVariants: Variants
  className?: string
}

/**
 * whileInView（once）でフェード＋ライズさせる汎用ラッパ。
 * reduced-motion 時は reducedVariants（フェードのみ）へ縮退する。
 * 親に stagger コンテナがある場合でも variants 名（hidden/show）が一致するので連動する。
 */
export default function Reveal({
  children,
  variants,
  reducedVariants,
  className,
}: RevealProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={reduce ? reducedVariants : variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  )
}
