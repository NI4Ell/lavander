import Image from 'next/image'
import Link from 'next/link'
import AddToCartButton from '@/components/ui/AddToCartButton'
import { formatPrice } from '@/lib/format'

interface ProductCardProps {
  id: string
  slug: string
  name: string
  photoUrl: string | null
  basePrice: number
  discountPrice: number | null
  outOfStock?: boolean
}

export default function ProductCard({
  id,
  slug,
  name,
  photoUrl,
  basePrice,
  discountPrice,
  outOfStock = false,
}: ProductCardProps) {
  const actualPrice = discountPrice ?? basePrice

  return (
    <article className="flex flex-col items-center gap-[6px] relative text-center">

      {/* 1. Photo ────────────────────────────── */}
      <Link href={`/product/${slug}`} className="w-full block">
        <div className="relative w-full aspect-[4/5] rounded-[4px] overflow-hidden border-[1.5px] border-ink mb-1 bg-paper-2">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={name}
              fill
              sizes="(max-width: 680px) 50vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center text-ink-soft text-[15px]"
              style={{
                background:
                  'repeating-linear-gradient(135deg, transparent 0 10px, rgba(31,26,36,0.08) 10px 11px)',
              }}
            >
              фото букета
            </div>
          )}
        </div>
      </Link>

      {/* 2. "Добавить в корзину" / "Нет в наличии" ── */}
      {outOfStock ? (
        <span className="text-[14px] text-ink-soft py-[5px] max-md:text-[13px]">
          Нет в наличии
        </span>
      ) : (
        <AddToCartButton
          product={{ id, slug, name, photoUrl, price: actualPrice }}
        />
      )}

      {/* 3. Название ─────────────────────────── */}
      <Link
        href={`/product/${slug}`}
        className="text-[18px] text-ink-soft leading-tight max-md:text-[15px] hover:text-purple transition-colors"
      >
        {name}
      </Link>

      {/* 4. Цена ─────────────────────────────── */}
      <div className="text-[18px] max-md:text-[15px]">
        {discountPrice ? (
          <span className="inline-flex items-center gap-2">
            <span className="text-ink font-semibold">{formatPrice(discountPrice)}</span>
            <span className="line-through text-ink-soft text-[14px]">{formatPrice(basePrice)}</span>
          </span>
        ) : (
          <span className="text-ink">{formatPrice(basePrice)}</span>
        )}
      </div>

    </article>
  )
}
