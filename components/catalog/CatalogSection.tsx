'use client'

import { useMemo, useState } from 'react'
import { type ProductStatus } from '@prisma/client'
import ProductCard from './ProductCard'
import SortSelect, { type SortOption } from './SortSelect'

const INITIAL_COUNT = 4

type ProductRow = {
  id:            string
  slug:          string
  name:          string
  basePrice:     number
  discountPrice: number | null
  status:        ProductStatus
  photos:        { url: string }[]
}

interface Props {
  section: {
    key:           string
    label:         string
    firstSection?: boolean
  }
  products: ProductRow[]
}

export default function CatalogSection({ section, products }: Props) {
  const [showAll, setShowAll] = useState(false)
  const [sort,    setSort]    = useState<SortOption>('default')

  // Сортируем на клиенте без перезагрузки страницы
  const sortedProducts = useMemo(() => {
    if (sort === 'price_asc') {
      return [...products].sort(
        (a, b) => (a.discountPrice ?? a.basePrice) - (b.discountPrice ?? b.basePrice),
      )
    }
    if (sort === 'price_desc') {
      return [...products].sort(
        (a, b) => (b.discountPrice ?? b.basePrice) - (a.discountPrice ?? a.basePrice),
      )
    }
    return products // 'default' — сохраняем серверный порядок (sortOrder asc)
  }, [products, sort])

  const visible     = showAll ? sortedProducts : sortedProducts.slice(0, INITIAL_COUNT)
  const hiddenCount = sortedProducts.length - INITIAL_COUNT

  return (
    <section
      id={section.key}
      className="px-[60px] pt-10 pb-7 section-divider max-md:px-4 max-md:pt-7 max-md:pb-5"
    >
      <h2
        className={[
          'text-center text-purple mb-5',
          section.firstSection
            ? 'text-[48px] font-bold tracking-tight max-md:text-[32px]'
            : 'text-[44px] font-semibold max-md:text-[28px]',
        ].join(' ')}
      >
        {section.label}
      </h2>

      {products.length === 0 && (
        <p className="text-center text-ink-soft py-10">
          В этой категории пока нет товаров
        </p>
      )}

      {products.length > 0 && (
        <>
          {/* ── Section tools: сортировка ─────────── */}
          <div className="flex justify-end mb-4">
            <SortSelect value={sort} onChange={setSort} />
          </div>

          {/* ── Сетка товаров ────────────────────── */}
          <div className="grid grid-cols-4 gap-7 max-md:grid-cols-2 max-md:gap-[14px_12px]">
            {visible.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                slug={p.slug}
                name={p.name}
                basePrice={p.basePrice}
                discountPrice={p.discountPrice}
                photoUrl={p.photos[0]?.url ?? null}
                outOfStock={p.status === 'OUT_OF_STOCK'}
              />
            ))}
          </div>

          {/* ── Показать ещё ─────────────────────── */}
          {!showAll && hiddenCount > 0 && (
            <div className="flex justify-center mt-7">
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="px-6 py-[10px] bg-lav border-[1.5px] border-ink rounded-[6px] text-[16px] text-ink-soft font-medium transition-colors hover:bg-pink-soft"
              >
                Показать ещё ({hiddenCount})
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
