'use client'

import { motion } from 'framer-motion'

interface ButtonProps {
  /** Visual style */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Disabled state */
  disabled?: boolean
  /** Click handler */
  onClick?: () => void
  /** Button contents */
  children: React.ReactNode
  /** Additional CSS classes */
  className?: string
  /** HTML button type */
  type?: 'button' | 'submit' | 'reset'
}

const VARIANT_STYLES = {
  primary: {
    base: 'bg-gradient-to-br from-accent to-pink-600 text-white shadow-lg shadow-accent/25',
    hover: 'hover:shadow-accent/40 hover:brightness-110',
    disabled: 'opacity-50 cursor-not-allowed shadow-none',
  },
  secondary: {
    base: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25',
    hover: 'hover:shadow-blue-500/40 hover:brightness-110',
    disabled: 'opacity-50 cursor-not-allowed shadow-none',
  },
  danger: {
    base: 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/25',
    hover: 'hover:shadow-red-500/40 hover:brightness-110',
    disabled: 'opacity-50 cursor-not-allowed shadow-none',
  },
  ghost: {
    base: 'bg-transparent border border-white/20 text-white/80',
    hover: 'hover:bg-white/5 hover:border-white/30 hover:text-white',
    disabled: 'opacity-40 cursor-not-allowed',
  },
} as const

const SIZE_STYLES = {
  sm: 'px-4 py-1.5 text-sm rounded-lg',
  md: 'px-6 py-2.5 text-base rounded-xl',
  lg: 'px-8 py-3.5 text-lg rounded-xl',
} as const

/**
 * Animated button with multiple variants and sizes.
 *
 * Uses Framer Motion for a spring-scale press effect.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children,
  className = '',
  type = 'button',
}: ButtonProps) {
  const styles = VARIANT_STYLES[variant]

  return (
    <motion.button
      type={type}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        font-heading font-semibold
        transition-all duration-200 ease-out
        ${styles.base}
        ${disabled ? styles.disabled : styles.hover}
        ${SIZE_STYLES[size]}
        ${className}
      `}
    >
      {children}
    </motion.button>
  )
}
