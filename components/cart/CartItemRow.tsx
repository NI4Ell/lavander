'use client'

import Image from 'next/image'
import Link from 'next/link'
import Qty from '@/components/ui/Qty'
import { formatPrice } from '@/lib/format'
import type { CartItem } from '@/store/cart'

interface Props {
  item: CartItem
  onQtyChange: (id: string, qty: number) => void
  onRemove: (id: string) => void
}

const PH_BG = 'repeating-linear-gradient(135deg, transparent 0 10px, rgba(31,26,36,0.08) 10px 11px)'

export default function CartItemRow({ item, onQtyChange, onRemove }: Props) {
  const totalPrice = (item.price + (item.addonsPrice ?? 0)) * item.qty

  const addons: string[] = []
  if (item.hasPostcard) addons.push('с открыткой')
  if (item.hasAquabox)  addons.push('аквабокс')
  if (item.hasBag)      addons.push('пакет')
  const addonLabel = addons.length > 0 ? addons.join(' · ') : 'за букет'

  return (
    <div
      className={[
        'border-[1.5px] border-ink rounded-[10px] p-[14px] bg-paper',
        // Desktop: flex row
        'md:flex md:items-center md:gap-4',
        // Mobile: 2-row grid
        'max-md:grid max-md:grid-cols-[70px_1fr_auto] max-md:gap-x-[10px] max-md:gap-y-[4px]',
      ].join(' ')}
    >

      {/* ── Фото ────────────────────────────────── */}
      <Link
        href={`/product/${item.slug}`}
        className={[
          'relative rounded-[4px] overflow-hidden border-[1.5px] border-ink bg-paper-2 shrink-0',
          // Desktop
          'md:w-[110px] md:h-[110px]',
          // Mobile: col 1, span 2 rows
          'max-md:col-start-1 max-md:row-span-2 max-md:w-[70px] max-md:h-[70px]',
        ].join(' ')}
      >
        {item.photoUrl ? (
          <Image
            src={item.photoUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 70px, 110px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: PH_BG }} />
        )}
      </Link>

      {/* ── Название ────────────────────────────── */}
      <div
        className={[
          'min-w-0',
          'md:flex-1',
          'max-md:col-start-2 max-md:row-start-1 max-md:self-end',
        ].join(' ')}
      >
        <Link
          href={`/product/${item.slug}`}
          className="block text-[24px] text-purple leading-tight hover:underline max-md:text-[16px]"
        >
          {item.name}
        </Link>
        <p className="text-[13px] text-ink-soft mt-[2px] m-0">{addonLabel}</p>
      </div>

      {/* ── Кол-во (только desktop) ─────────────── */}
      <div className="max-md:hidden">
        <Qty value={item.qty} onChange={(q) => onQtyChange(item.id, q)} />
      </div>

      {/* ── Цена (только desktop) ───────────────── */}
      <div className="max-md:hidden text-[24px] text-ink min-w-[110px] text-right">
        {formatPrice(totalPrice)}
      </div>

      {/* ── Кол-во + цена (только mobile) ───────── */}
      <div
        className={[
          'md:hidden',
          'max-md:col-start-2 max-md:col-end-4 max-md:row-start-2',
          'flex items-center justify-between',
        ].join(' ')}
      >
        <Qty value={item.qty} onChange={(q) => onQtyChange(item.id, q)} />
        <div className="text-[18px] text-ink font-medium">
          {formatPrice(totalPrice)}
        </div>
      </div>

      {/* ── Удалить ─────────────────────────────── */}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        aria-label="Удалить из корзины"
        className={[
          'w-7 h-7 grid place-items-center text-ink-soft hover:text-[#b04a6a] transition-colors cursor-pointer',
          'md:shrink-0',
          'max-md:col-start-3 max-md:row-start-1 max-md:self-start',
        ].join(' ')}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <line x1="4" y1="4"  x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="4" x2="4"  y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

    </div>
  )
}
