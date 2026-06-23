import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { formatPrice } from '@/lib/format'
import ProductGallery from '@/components/product/ProductGallery'
import QtyAddBlock from '@/components/product/QtyAddBlock'
import Accordion from '@/components/product/Accordion'

// ── Category labels for breadcrumbs ──────────────────────
const CAT_LABELS: Record<string, { label: string; href: string }> = {
  BOUQUET: { label: 'сборные букеты', href: '/?cat=bouquet' },
  MONO:    { label: 'монобукеты',     href: '/?cat=mono'    },
  BOX:     { label: 'композиции в коробках', href: '/?cat=box' },
  BASKET:  { label: 'композиции в корзинах', href: '/?cat=basket' },
  WEDDING: { label: 'свадебные букеты', href: '/?cat=wedding' },
}

// ── Metadata ─────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name:          true,
      description:   true,
      basePrice:     true,
      discountPrice: true,
      photos: { where: { position: 0 }, take: 1, select: { url: true } },
    },
  })
  if (!product) return { title: 'Товар не найден' }
  const photoUrl = product.photos[0]?.url
  return {
    title: `«${product.name}»`,
    description:
      product.description ??
      `Купить букет «${product.name}» в Гомеле. Цена ${formatPrice(product.discountPrice ?? product.basePrice)}. Доставка от 180 минут.`,
    openGraph: {
      title: `«${product.name}» — Лавандер`,
      images: photoUrl ? [{ url: photoUrl }] : [],
    },
  }
}

// ── Page ─────────────────────────────────────────────────
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug, status: { in: ['AVAILABLE', 'OUT_OF_STOCK'] } },
    include: {
      photos: { orderBy: { position: 'asc' } },
    },
  })

  if (!product) notFound()

  const actualPrice = product.discountPrice ?? product.basePrice
  const discountPct = product.discountPrice
    ? Math.round((1 - product.discountPrice / product.basePrice) * 100)
    : null

  const catInfo = CAT_LABELS[product.category] ?? { label: 'каталог', href: '/' }
  const mainPhotoUrl = product.photos[0]?.url ?? null

  return (
    <>
      {/* ── Breadcrumbs ───────────────────────── */}
      <nav className="px-[60px] py-4 text-[16px] text-ink-soft max-md:px-4 max-md:py-3">
        <Link href="/" className="text-purple hover:underline">главная</Link>
        {' / '}
        <Link href={catInfo.href} className="text-purple hover:underline">{catInfo.label}</Link>
        {' / '}
        <span>«{product.name}»</span>
      </nav>

      {/* ── Product layout: 1.1fr | 1fr ──────── */}
      <section className="grid grid-cols-[1.1fr_1fr] gap-9 px-[60px] pb-10 max-md:grid-cols-1 max-md:px-4 max-md:gap-6">

        {/* Left: Gallery */}
        <ProductGallery photos={product.photos} name={product.name} />

        {/* Right: Info */}
        <div className="flex flex-col gap-3">

          {/* Name */}
          <h1 className="text-[56px] text-purple leading-[0.95] m-0 font-normal max-md:text-[36px]">
            {product.name}
          </h1>

          {/* Price / availability */}
          {product.status === 'OUT_OF_STOCK' ? (
            <div className="text-[36px] max-md:text-[26px] text-ink-soft">Нет в наличии</div>
          ) : (
            <>
              <div className="text-[36px] max-md:text-[26px]">
                {product.discountPrice ? (
                  <span className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold">{formatPrice(product.discountPrice)}</span>
                    <span className="line-through text-ink-soft text-[22px]">{formatPrice(product.basePrice)}</span>
                    {discountPct && (
                      <span className="w-11 h-11 rounded-full bg-green border-[1.5px] border-ink grid place-items-center text-[14px] font-bold text-ink">
                        -{discountPct}%
                      </span>
                    )}
                  </span>
                ) : (
                  <span>{formatPrice(product.basePrice)}</span>
                )}
              </div>

              {/* Qty + Add to cart — client component */}
              <QtyAddBlock
                product={{
                  id:       product.id,
                  slug:     product.slug,
                  name:     product.name,
                  photoUrl: mainPhotoUrl,
                  price:    actualPrice,
                }}
              />
            </>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-[16px] leading-[1.45] text-ink-soft m-0">
              {product.description}
            </p>
          )}

          {/* Shipping note */}
          <p className="text-[18px] text-ink-soft m-0">
            ✿ доставка по Гомелю от 180 минут &nbsp;·&nbsp; фото перед отправкой
          </p>

          {/* Disclaimer note */}
          <div className="mt-[14px] p-[14px_18px] bg-lav-soft border-[1.5px] border-ink rounded-[10px] text-[15px] leading-[1.5] text-ink">
            Цветы могут быть заменены на равнозначные в других оттенках или изменён состав,
            при этом стоимость и общее настроение букета сохранятся.
          </div>

          {/* Accordions */}
          <div className="flex flex-col gap-2 mt-1">

            {/* Composition */}
            {product.composition && (
              <Accordion title="Состав букета">
                {product.composition}
              </Accordion>
            )}

            {/* Care — defaultOpen */}
            {product.care && (
              <Accordion title="Уход за цветами" defaultOpen>
                <div className="flex flex-col gap-[10px]">
                  {/* Split care text by '. ' into checklist items */}
                  {product.care
                    .split(/\.\s+/)
                    .filter(Boolean)
                    .map((tip, i) => (
                      <div key={i} className="flex gap-[10px] items-start">
                        <span className="font-bold text-purple shrink-0 mt-[1px]">✓</span>
                        <span>{tip.endsWith('.') ? tip : `${tip}.`}</span>
                      </div>
                    ))}

                  {/* Static Кризал block */}
                  <div className="mt-[6px] p-[14px_16px] rounded-[10px] bg-pink-soft border-[1.5px] border-ink">
                    <p className="text-[16px] font-bold text-purple m-0 mb-[6px]">
                      Удобрение «Кризал» — в подарок к букету!
                    </p>
                    <p className="text-[14px] leading-[1.55] m-0">
                      Добавьте 1 пакетик на 1 литр воды — и цветы простоят значительно дольше.
                      «Кризал» обеспечивает долгую свежесть срезанных цветов, длительное цветение,
                      полноценное распускание бутонов, хорошее питание и оптимальное увлажнение,
                      а также сохранение окраса лепестков и листьев.
                    </p>
                  </div>
                </div>
              </Accordion>
            )}

            {/* Delivery & payment */}
            <Accordion title="Доставка и оплата">
              Доставка по г. Гомелю — 10 BYN. Бесплатно при заказе от 100 BYN.
              В праздничные дни — 15 BYN.
              Самовывоз по адресу: г. Гомель, ул. Речицкая, 2 — бесплатно.
              Минимальный срок доставки — 180 минут.
              Оплата картой онлайн: Visa, Mastercard, Белкарт, Apple Pay, Samsung Pay.
            </Accordion>

          </div>
        </div>
      </section>
    </>
  )
}
