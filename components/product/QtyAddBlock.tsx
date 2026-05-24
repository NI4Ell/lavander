'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/format'
import Checkbox from '@/components/ui/Checkbox'
import { TextareaField } from '@/components/ui/InputField'

interface Props {
  product: {
    id: string
    slug: string
    name: string
    photoUrl: string | null
    price: number   // kopecks — discountPrice ?? basePrice
  }
}

// Фиксированные цены аддонов (копейки). СЕРВЕР пересчитает свои значения.
export const ADDON_PRICES = {
  POSTCARD: 200,    // 2 BYN
  AQUABOX:  1000,   // 10 BYN
  BAG:      1500,   // 15 BYN
} as const

const MinusIcon = () => (
  <svg width="14" height="2" viewBox="0 0 14 2" fill="none">
    <line x1="1" y1="1" x2="13" y2="1" stroke="#1f1a24" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <line x1="7" y1="1" x2="7" y2="13" stroke="#1f1a24" strokeWidth="2" strokeLinecap="round"/>
    <line x1="1" y1="7" x2="13" y2="7" stroke="#1f1a24" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export default function QtyAddBlock({ product }: Props) {
  const [qty, setQty]   = useState(1)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  // Аддоны
  const [hasPostcard,  setHasPostcard]  = useState(false)
  const [postcardText, setPostcardText] = useState('')
  const [hasAquabox,   setHasAquabox]   = useState(false)
  const [hasBag,       setHasBag]       = useState(false)

  // Сумма аддонов на единицу букета
  const addonsPrice =
    (hasPostcard ? ADDON_PRICES.POSTCARD : 0) +
    (hasAquabox  ? ADDON_PRICES.AQUABOX  : 0) +
    (hasBag      ? ADDON_PRICES.BAG      : 0)

  // Итоговая цена в кнопке
  const lineTotal = (product.price + addonsPrice) * qty

  function handleAdd() {
    addItem(
      {
        id:           product.id,
        slug:         product.slug,
        name:         product.name,
        photoUrl:     product.photoUrl,
        price:        product.price,
        hasPostcard,
        postcardText: hasPostcard && postcardText.trim().length > 0 ? postcardText.trim() : undefined,
        hasAquabox,
        hasBag,
        addonsPrice,
      },
      qty,
    )
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <div className="flex flex-col gap-3">

      {/* ── Аддоны ──────────────────────────────────── */}
      <div className="flex flex-col gap-[10px] mt-1">
        <p className="text-[18px] text-purple m-0">дополнения к букету</p>

        {/* Открытка */}
        <div className="flex flex-col gap-2 border-[1.5px] border-ink rounded-[10px] p-[12px_14px] bg-paper">
          <label className="flex items-center gap-[10px] cursor-pointer text-[15px] select-none">
            <Checkbox checked={hasPostcard} onChange={setHasPostcard} />
            <span className="flex-1">Открытка с пожеланием</span>
            <span className="text-ink-soft">+ {formatPrice(ADDON_PRICES.POSTCARD)}</span>
          </label>
          {hasPostcard && (
            <TextareaField
              value={postcardText}
              onChange={(e) => setPostcardText(e.target.value)}
              placeholder="Текст открытки (необязательно)"
              rows={3}
            />
          )}
        </div>

        {/* Аквабокс */}
        <label className="flex items-center gap-[10px] cursor-pointer text-[15px] select-none border-[1.5px] border-ink rounded-[10px] p-[12px_14px] bg-paper">
          <Checkbox checked={hasAquabox} onChange={setHasAquabox} />
          <span className="flex-1">Аквабокс (свежая вода в пути)</span>
          <span className="text-ink-soft">+ {formatPrice(ADDON_PRICES.AQUABOX)}</span>
        </label>

        {/* Пакет-переноска */}
        <label className="flex items-center gap-[10px] cursor-pointer text-[15px] select-none border-[1.5px] border-ink rounded-[10px] p-[12px_14px] bg-paper">
          <Checkbox checked={hasBag} onChange={setHasBag} />
          <span className="flex-1">Пакет-переноска</span>
          <span className="text-ink-soft">+ {formatPrice(ADDON_PRICES.BAG)}</span>
        </label>
      </div>

      {/* ── Qty row ─────────────────────────────────── */}
      <div className="flex items-center gap-[14px] flex-wrap text-[18px] mt-1">
        <span>количество:</span>
        <div className="inline-flex items-center border-[1.5px] border-ink rounded-[8px] overflow-hidden text-[22px]">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-[42px] flex items-center justify-center py-[6px] cursor-pointer hover:bg-lav-soft transition-colors"
            aria-label="Уменьшить"
          >
            <MinusIcon />
          </button>
          <b className="px-[18px] py-[6px] border-l-[1.5px] border-r-[1.5px] border-ink min-w-[50px] text-center font-normal">
            {qty}
          </b>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-[42px] flex items-center justify-center py-[6px] cursor-pointer hover:bg-lav-soft transition-colors"
            aria-label="Увеличить"
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {/* ── Add to cart button ──────────────────────── */}
      <button
        onClick={handleAdd}
        className={[
          'w-full py-4 px-7 border-[1.5px] border-ink rounded-[8px]',
          'text-[24px] flex items-center justify-center gap-2',
          'transition-[opacity,background] duration-150 cursor-pointer',
          'max-md:text-[18px] max-md:py-[14px]',
          added ? 'bg-green text-ink' : 'bg-ink text-paper hover:opacity-85',
        ].join(' ')}
      >
        {added
          ? '✓ Добавлено в корзину'
          : `Добавить в корзину · ${formatPrice(lineTotal)}`}
      </button>
    </div>
  )
}
