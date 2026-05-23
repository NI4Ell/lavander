'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import BurgerMenu from './BurgerMenu'
import CartHeaderBtn from './CartHeaderBtn'

const SOCIAL = [
  { href: 'tel:+375291190699',                    src: '/icons/phone.png',     alt: 'Телефон',   target: undefined },
  { href: 'https://www.instagram.com/lavander.gomel/', src: '/icons/instagram.png', alt: 'Instagram', target: '_blank' },
  { href: 'https://t.me/+375291190699',            src: '/icons/telegram.png', alt: 'Telegram',  target: '_blank' },
]

const IconBurger = () => (
  <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
    <line x1="0" y1="1"  x2="18" y2="1"  stroke="#1f1a24" strokeWidth="2" strokeLinecap="round"/>
    <line x1="0" y1="7"  x2="18" y2="7"  stroke="#1f1a24" strokeWidth="2" strokeLinecap="round"/>
    <line x1="0" y1="13" x2="18" y2="13" stroke="#1f1a24" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export default function Header() {
  const [burgerOpen, setBurgerOpen] = useState(false)

  return (
    <>
      <header
        className={[
          'bg-lav border-b-[1.5px] border-ink',
          // Mobile: простой flex с justify-between
          // Высота хедера = высота логотипа, без вертикальных отступов
          'flex items-center justify-between px-[14px] py-0',
          // Desktop: 3-column grid, другой горизонтальный отступ
          'md:grid md:grid-cols-[1fr_auto_1fr] md:px-9',
        ].join(' ')}
      >

        {/* ── Левая колонка ─────────────────────────────── */}
        <div>
          {/* Mobile: бургер-кнопка */}
          <button
            onClick={() => setBurgerOpen(true)}
            className="md:hidden flex items-center justify-center w-9 h-9 border-[1.5px] border-ink rounded-[8px] bg-paper cursor-pointer"
            aria-label="Открыть меню"
          >
            <IconBurger />
          </button>

          {/* Desktop: навигационные ссылки */}
          <nav className="hidden md:flex gap-6 text-[18px]">
            {[
              { label: 'Каталог',          href: '/' },
              { label: 'Доставка и оплата', href: '/delivery' },
              { label: 'О нас',            href: '/about' },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="border-b-[1.5px] border-b-transparent pb-[2px] hover:border-b-ink transition-[border-color] duration-150"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Логотип (центр) ───────────────────────────── */}
        <Link href="/" className="flex flex-col items-center justify-center gap-1">
          {/* Desktop */}
          <Image
            src="/logo.png"
            alt="Лавандер"
            width={80}
            height={80}
            priority
            className="rounded-full object-cover border-[1.5px] border-ink hidden md:block"
          />
          {/* Mobile */}
          <Image
            src="/logo.png"
            alt="Лавандер"
            width={70}
            height={70}
            priority
            className="rounded-full object-cover border-[1.5px] border-ink md:hidden"
          />
        </Link>

        {/* ── Правая колонка ────────────────────────────── */}
        <div className="flex items-center gap-3 justify-end">
          {/* Иконки соцсетей — только desktop */}
          {SOCIAL.map(({ href, src, alt, target }) => (
            <a
              key={alt}
              href={href}
              target={target}
              rel={target ? 'noreferrer' : undefined}
              aria-label={alt}
              className="hidden md:flex"
            >
              <Image src={src} alt={alt} width={28} height={28} />
            </a>
          ))}

          {/* Корзина — текст на desktop, иконка на mobile */}
          <CartHeaderBtn />
        </div>

      </header>

      <BurgerMenu isOpen={burgerOpen} onClose={() => setBurgerOpen(false)} />
    </>
  )
}
