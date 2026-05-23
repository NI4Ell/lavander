'use client'

import { useEffect, useRef, useState } from 'react'

export type SortOption = 'default' | 'price_asc' | 'price_desc'

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default',    label: 'По умолчанию' },
  { value: 'price_asc',  label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
]

interface Props {
  value:    SortOption
  onChange: (v: SortOption) => void
}

export default function SortSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const currentLabel = OPTIONS.find((o) => o.value === value)?.label ?? 'По умолчанию'

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function handleSelect(v: SortOption) {
    onChange(v)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">

      {/* ── Trigger ─────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-[6px] px-3 py-[7px] bg-paper border-[1.5px] border-ink rounded-[6px] text-[14px] text-ink cursor-pointer select-none whitespace-nowrap transition-colors hover:bg-lav/20"
      >
        <span>{currentLabel}</span>
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none"
          className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="#1f1a24" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* ── Dropdown ────────────────────────────── */}
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[190px] bg-paper border-[1.5px] border-ink rounded-[6px] shadow-[0_6px_20px_rgba(111,79,155,.12)] overflow-hidden">
          {OPTIONS.map(({ value: v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => handleSelect(v)}
              className={[
                'w-full text-left px-3 py-[9px] text-[14px] text-ink',
                'cursor-pointer hover:bg-lav/30 transition-colors',
                v === value ? 'font-semibold' : 'font-normal',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      )}

    </div>
  )
}
