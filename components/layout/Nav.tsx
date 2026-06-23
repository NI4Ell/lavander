'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const CATEGORIES = [
  { key: 'vitrina', label: 'актуальная витрина' },
  { key: 'bouquet', label: 'сборные букеты' },
  { key: 'mono',    label: 'монобукеты' },
  { key: 'box',     label: 'композиции в коробках' },
  { key: 'basket',  label: 'композиции в корзинах' },
  { key: 'wedding', label: 'свадебные букеты' },
] as const

type CatKey = (typeof CATEGORIES)[number]['key']

export default function Nav() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  // Active cat — derived from URL, kept in local state so scrolling can update it without a server re-fetch
  const urlCat = (searchParams.get('cat') as CatKey | null) ?? 'vitrina'
  const [activeCat, setActiveCat] = useState<CatKey>(urlCat)

  // Sync when URL changes (e.g. browser back/forward)
  useEffect(() => {
    setActiveCat(urlCat)
  }, [urlCat])

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, key: CatKey) {
    if (pathname !== '/') {
      // On /about, /delivery, etc. → just navigate to /?cat=key (let the browser follow the href)
      return
    }

    // On the home page → scroll to the section anchor without a full navigation
    e.preventDefault()

    const el = document.getElementById(key)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    // Update the URL so the address bar and back/forward work correctly,
    // but without triggering a Next.js page re-fetch.
    window.history.replaceState(null, '', `/?cat=${key}`)
    setActiveCat(key)
  }

  return (
    <nav
      className={[
        // Desktop: centred, wrapping, 22 px
        'bg-purple text-paper flex justify-center flex-wrap',
        'gap-9 px-6 py-4 text-[22px] lowercase',
        // Mobile: horizontal scroll, no wrap, smaller text
        'max-md:justify-start max-md:flex-nowrap max-md:gap-0',
        'max-md:overflow-x-auto max-md:px-0 max-md:py-0',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
      ].join(' ')}
    >
      {CATEGORIES.map(({ key, label }) => {
        const isActive = key === activeCat
        return (
          <a
            key={key}
            href={`/?cat=${key}`}
            onClick={(e) => handleClick(e, key)}
            className={[
              'transition-[opacity,color] duration-150 cursor-pointer',
              // Mobile: padding for tap target + smaller text
              'max-md:px-4 max-md:py-3 max-md:text-[15px] max-md:whitespace-nowrap max-md:shrink-0',
              isActive
                ? 'opacity-100 text-pink-soft'
                : 'opacity-75 hover:opacity-100 text-paper',
            ].join(' ')}
          >
            {label}
          </a>
        )
      })}
    </nav>
  )
}
