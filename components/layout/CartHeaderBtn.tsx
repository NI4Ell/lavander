'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { selectItemCount, useCartStore } from '@/store/cart'

const IconCart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f1a24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)

export default function CartHeaderBtn() {
  const [mounted, setMounted] = useState(false)
  const count = useCartStore(selectItemCount)

  useEffect(() => setMounted(true), [])

  const displayCount = mounted ? count : 0

  return (
    <Link href="/cart" className="relative flex">

      {/* ── Desktop: текстовая кнопка ───────────── */}
      <span className="hidden md:inline-flex items-center border-[1.5px] border-ink rounded-[8px] px-[18px] py-[6px] bg-paper text-[18px] whitespace-nowrap hover:bg-lav-soft transition-colors duration-150">
        Корзина{displayCount > 0 ? ` (${displayCount})` : ''}
      </span>

      {/* ── Mobile: иконка с бейджем ────────────── */}
      <span className="md:hidden relative w-9 h-9 grid place-items-center border-[1.5px] border-ink rounded-[8px] bg-paper hover:bg-lav-soft transition-colors duration-150">
        <IconCart />
        {displayCount > 0 && (
          <span className="absolute -top-[7px] -right-[7px] min-w-[18px] h-[18px] px-[3px] rounded-full bg-purple text-paper text-[10px] leading-none grid place-items-center font-bold">
            {displayCount > 9 ? '9+' : displayCount}
          </span>
        )}
      </span>

    </Link>
  )
}
