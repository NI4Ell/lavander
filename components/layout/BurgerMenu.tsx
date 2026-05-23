'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'

// SVG icons
const IconPhone = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1f1a24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.7A2 2 0 0 1 22 16.9z"/>
  </svg>
)

const IconInsta = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1f1a24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5"/>
    <circle cx="12" cy="12" r="4.5"/>
    <circle cx="17.5" cy="6.5" r="1" fill="#1f1a24" stroke="none"/>
  </svg>
)

const IconTg = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1f1a24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2" fill="#1f1a24" stroke="none"/>
  </svg>
)

const NAV_LINKS = [
  { num: '01', label: 'Каталог', href: '/' },
  { num: '02', label: 'Доставка и оплата', href: '/delivery' },
  { num: '03', label: 'О нас', href: '/about' },
]

interface BurgerMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function BurgerMenu({ isOpen, onClose }: BurgerMenuProps) {
  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[400] flex flex-col bg-lav-soft animate-[bmFade_0.22s_ease_forwards]"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-[14px] py-[10px] bg-lav border-b border-b-[rgba(31,26,36,0.12)]">
        <Link href="/" onClick={onClose}>
          <Image
            src="/logo.png"
            alt="Лавандер"
            width={50}
            height={50}
            className="rounded-full border-[1.5px] border-ink object-cover"
          />
        </Link>
        <button
          onClick={onClose}
          className="w-9 h-9 border border-[rgba(31,26,36,0.3)] rounded-[8px] flex items-center justify-center text-xl text-ink bg-transparent cursor-pointer"
          aria-label="Закрыть меню"
        >
          ×
        </button>
      </div>

      {/* Links */}
      <nav className="flex flex-col justify-center flex-1 px-7 gap-0">
        {NAV_LINKS.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className={[
              'flex items-center gap-4 py-[22px] text-[26px] font-normal text-ink',
              'border-b border-b-[rgba(111,79,155,0.2)]',
              'transition-colors duration-150 hover:text-purple',
              i === 0 ? 'border-t border-t-[rgba(111,79,155,0.2)]' : '',
            ].join(' ')}
          >
            <span className="text-[13px] text-purple/70 min-w-[24px]">{link.num}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Bottom bar */}
      <div className="flex items-center gap-3 px-7 pb-9 pt-5">
        <a href={`tel:${process.env.NEXT_PUBLIC_SHOP_PHONE ?? '+375296634023'}`}
           className="w-8 h-8 rounded-full border-[1.5px] border-ink bg-paper grid place-items-center">
          <IconPhone />
        </a>
        <a href="https://instagram.com" target="_blank" rel="noreferrer"
           className="w-8 h-8 rounded-full border-[1.5px] border-ink bg-paper grid place-items-center">
          <IconInsta />
        </a>
        <a href="https://t.me" target="_blank" rel="noreferrer"
           className="w-8 h-8 rounded-full border-[1.5px] border-ink bg-paper grid place-items-center">
          <IconTg />
        </a>
        <Link
          href="/cart"
          onClick={onClose}
          className="flex-1 text-center py-[11px] px-5 border-[1.5px] border-ink rounded-[8px] bg-ink text-paper text-[16px]"
        >
          Корзина
        </Link>
      </div>

      <style>{`
        @keyframes bmFade {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
