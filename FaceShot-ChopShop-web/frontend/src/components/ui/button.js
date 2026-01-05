import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-black text-white hover:bg-gray-800',
        outline: 'border border-gray-300 hover:bg-gray-50',
        ghost: 'hover:bg-gray-100',
        hero: 'bg-black text-white shadow-lg hover:bg-gray-800',
        heroOutline: 'border border-gray-300 bg-white hover:bg-gray-50',
        glow: 'bg-black text-white shadow-[0_0_20px_rgba(0,0,0,0.35)] hover:bg-gray-800',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        xl: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export function Button({ className, variant, size, children, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  )
}

