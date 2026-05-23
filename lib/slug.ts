/**
 * Slug-генератор: транслит из русского в ASCII + uniqueness check по БД.
 *
 * Slug используется в URL карточки товара (/product/<slug>), поэтому
 * должен быть строго `[a-z0-9-]+` и уникален в таблице Product.
 */

import { prisma } from '@/lib/db'

/** Таблица транслитерации кириллицы. */
const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
  з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
  я: 'ya',
}

/**
 * Превращает произвольный текст в URL-friendly slug:
 *   «Лавандовый сон!» → 'lavandovyj-son'
 *   «Test 123»        → 'test-123'
 *   ''                → ''  (вызывающий код подставит fallback)
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/**
 * Возвращает slug, гарантированно отсутствующий в `Product.slug`.
 * При коллизии добавляет суффикс -2, -3, ... — простой и предсказуемый.
 *
 * Note: не атомарно — между findUnique и create теоретически может
 * вклиниться другой запрос. Для нашего масштаба (1 OWNER, ≤ 100 товаров)
 * это не проблема; уникальный индекс в Prisma всё равно отловит коллизию
 * (бросит P2002 — обработаем в wizard'е через try/catch если понадобится).
 */
export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || 'product'
  let candidate = base
  let i = 2
  while (await prisma.product.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${i++}`
  }
  return candidate
}
