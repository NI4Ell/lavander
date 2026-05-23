'use client'

import { useState } from 'react'
import { useCartStore, type CartItem } from '@/store/cart'

interface Props {
  product: Omit<CartItem, 'qty'>
}

export default function AddToCartButton({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <button
      onClick={handleAdd}
      className={[
        'inline-flex items-center justify-center w-[80%] px-3 py-[9px]',
        'border-[1.5px] border-ink rounded-[6px]',
        'text-[17px] text-ink-soft cursor-pointer',
        'transition-colors duration-150',
        added ? 'bg-green' : 'bg-lav hover:bg-pink-soft',
        'max-md:w-full max-md:text-[14px] max-md:py-[7px] max-md:px-2',
      ].join(' ')}
      aria-label={`Добавить «${product.name}» в корзину`}
    >
      {added ? '✓ Добавлено' : 'Добавить в корзину'}
    </button>
  )
}
