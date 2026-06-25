import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { Category, type ProductStatus } from '@prisma/client'
import CatalogSection from '@/components/catalog/CatalogSection'

export const metadata: Metadata = {
  title: { absolute: 'Букеты в Гомеле | Лавандер — букетная мастерская' },
  description: 'Каталог свежих букетов и цветочных композиций. Сборные букеты, монобукеты, композиции в коробках и корзинах. Доставка по Гомелю.',
}

// ── Types ────────────────────────────────────────────────
type CatKey = 'vitrina' | 'bouquet' | 'mono' | 'box' | 'basket' | 'wedding'

interface Section {
  key:           CatKey
  label:         string
  firstSection?: boolean
}

const SECTIONS: Section[] = [
  { key: 'vitrina', label: 'Актуальная витрина', firstSection: true },
  { key: 'bouquet', label: 'Сборные букеты' },
  { key: 'mono',    label: 'Монобукеты' },
  { key: 'box',     label: 'Композиции в коробках' },
  { key: 'basket',  label: 'Композиции в корзинах' },
  { key: 'wedding', label: 'Свадебные букеты' },
]

const CAT_ENUM: Record<Exclude<CatKey, 'vitrina'>, Category> = {
  bouquet: 'BOUQUET',
  mono:    'MONO',
  box:     'BOX',
  basket:  'BASKET',
  wedding: 'WEDDING',
}

// ── Data fetching ────────────────────────────────────────
async function fetchSection(key: CatKey) {
  const statusFilter: { in: ProductStatus[] } = { in: ['AVAILABLE', 'OUT_OF_STOCK'] }
  const where =
    key === 'vitrina'
      ? { featuredInVitrina: true, status: statusFilter }
      : { category: CAT_ENUM[key], status: statusFilter }

  return prisma.product.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    select: {
      id:            true,
      slug:          true,
      name:          true,
      basePrice:     true,
      discountPrice: true,
      status:        true,
      photos: {
        where:  { position: 0 },
        take:   1,
        select: { url: true },
      },
    },
  })
}

// ── Page ─────────────────────────────────────────────────
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const results = await Promise.all(
    SECTIONS.map(async (s) => ({
      section:  s,
      products: await fetchSection(s.key),
    })),
  )

  return (
    <div>
      {results.map(({ section, products }) => (
        <CatalogSection key={section.key} section={section} products={products} />
      ))}
    </div>
  )
}
