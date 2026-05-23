import type { Metadata } from 'next'
import Link from 'next/link'
import CartView from '@/components/cart/CartView'

export const metadata: Metadata = {
  title: 'Корзина — Лавандер',
  description: 'Оформление заказа букета. Доставка по Гомелю и самовывоз.',
}

export default function CartPage() {
  return (
    <>
      <nav className="px-[60px] py-4 text-[16px] text-ink-soft max-md:px-4 max-md:py-3">
        <Link href="/" className="text-purple hover:underline">главная</Link>
        {' / '}
        <span>корзина</span>
      </nav>

      <h1 className="px-[60px] text-[56px] text-purple leading-[0.95] font-normal m-0 max-md:px-4 max-md:text-[36px]">
        корзина
      </h1>

      <CartView />
    </>
  )
}
