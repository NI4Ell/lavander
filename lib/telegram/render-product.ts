/**
 * Рендер карточки одного товара для меню /products.
 *
 * Выделено в отдельный модуль, чтобы и handler'ы (handlers/products.ts),
 * и conversations (conversations/edit-product.ts) могли вернуть пользователя
 * в меню товара после своего действия — без циклов импорта.
 */

import type { Product } from '@prisma/client'

import { prisma } from '@/lib/db'
import { formatPrice } from '@/lib/format'

import { CATEGORY_LABEL, PRODUCT_STATUS_LABEL, productMenuKeyboard } from './keyboard'

/** Готовый payload для sendMessage / editMessageText. */
export interface ProductMenuMessage {
  text: string
  reply_markup: ReturnType<typeof productMenuKeyboard>
}

/**
 * Берёт товар из БД и собирает текст карточки + клавиатуру.
 * Возвращает `null`, если товара уже нет (например, удалён в параллельной
 * сессии) — вызывающий код должен показать «Товар не найден».
 */
export async function renderProductMenu(productId: string): Promise<ProductMenuMessage | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { _count: { select: { photos: true } } },
  })
  if (!product) return null

  return {
    text: formatProductCard(product, product._count.photos),
    reply_markup: productMenuKeyboard(product),
  }
}

/** Текст карточки товара. */
export function formatProductCard(
  product: Pick<Product, 'name' | 'category' | 'status' | 'basePrice' | 'discountPrice' | 'featuredInVitrina'>,
  photosCount: number,
): string {
  const lines: string[] = []
  lines.push(`📦 ${product.name}`)
  lines.push('')
  lines.push(`Категория: ${CATEGORY_LABEL[product.category]}`)
  if (product.discountPrice != null) {
    lines.push(`Цена: ${formatPrice(product.discountPrice)} (без скидки ${formatPrice(product.basePrice)})`)
  } else {
    lines.push(`Цена: ${formatPrice(product.basePrice)}`)
  }
  lines.push(`Статус: ${PRODUCT_STATUS_LABEL[product.status]}`)
  lines.push(`Витрина: ${product.featuredInVitrina ? 'да' : 'нет'}`)
  lines.push(`Фото: ${photosCount}`)
  return lines.join('\n')
}
