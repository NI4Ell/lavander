'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/store/cart'

/**
 * Очищает корзину при монтировании. Рендерится на странице успешной оплаты —
 * так корзина пропадает только после реально прошедшего платежа, а при
 * отмене/неудаче (fail) сохраняется для повторной попытки.
 */
export default function ClearCartOnMount() {
  useEffect(() => {
    useCartStore.getState().clearCart()
  }, [])

  return null
}
