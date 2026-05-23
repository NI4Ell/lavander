'use client'

import { useState } from 'react'

interface AccordionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export default function Accordion({ title, children, defaultOpen = false }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          'w-full flex items-center justify-between px-4 py-3 text-left',
          'border-[1.5px] border-ink text-[20px] cursor-pointer',
          'transition-colors duration-150',
          open
            ? 'bg-lav-soft rounded-t-[8px]'
            : 'bg-paper-2 rounded-[8px] hover:bg-lav-soft',
        ].join(' ')}
      >
        <span>{title}</span>
        <span className="text-[20px] font-light leading-none select-none ml-4 shrink-0">
          {open ? '−' : '+'}
        </span>
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 py-4 border-[1.5px] border-t-0 border-ink rounded-b-[8px] bg-lav-soft text-[15px] leading-[1.55] text-ink-soft">
          {children}
        </div>
      )}
    </div>
  )
}
