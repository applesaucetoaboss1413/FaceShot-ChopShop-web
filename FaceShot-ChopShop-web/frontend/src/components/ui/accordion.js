import * as AccordionPrimitive from '@radix-ui/react-accordion'
import React from 'react'
import { cn } from '../../lib/utils'

export const Accordion = AccordionPrimitive.Root
export const AccordionItem = ({ className, ...props }) => (
  <AccordionPrimitive.Item
    className={cn('border rounded-lg overflow-hidden bg-white', className)}
    {...props}
  />
)

export const AccordionTrigger = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Header className="w-full">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 text-left font-medium hover:bg-gray-50',
          className
        )}
        {...props}
      >
        {children}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 ml-2 transition-transform data-[state=open]:rotate-180"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
)

export const AccordionContent = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn('px-4 py-3 text-gray-600', className)}
      {...props}
    >
      {children}
    </AccordionPrimitive.Content>
  )
)

