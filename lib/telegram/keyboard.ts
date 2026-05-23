import type { Category, OrderStatus, Product, ProductStatus } from '@prisma/client'
import type { InlineKeyboardMarkup } from 'grammy/types'

// ───────────────────────────────────────────────────────────
// ── СТАТУСЫ ЗАКАЗА (Этап 3)
// ───────────────────────────────────────────────────────────

/**
 * Линейный порядок статусов заказа.
 * Используется, чтобы вычислить «следующие» статусы — кнопки показываем только
 * для тех, чей индекс СТРОГО больше индекса текущего статуса.
 */
export const STATUS_FLOW: readonly OrderStatus[] = [
  'PENDING_PAYMENT',
  'PAID',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DONE',
] as const

/** Кнопки действий — только статусы, которыми флорист реально управляет. */
export const ACTION_BUTTONS: ReadonlyArray<{ status: OrderStatus; text: string }> = [
  { status: 'PREPARING',        text: '✅ Принять'   },
  { status: 'READY',            text: '📦 Готов'     },
  { status: 'OUT_FOR_DELIVERY', text: '🚚 В пути'    },
  { status: 'DONE',             text: '✓ Доставлен' },
] as const

/**
 * Собирает inline-клавиатуру для текущего статуса заказа.
 * Показывает только кнопки СЛЕДУЮЩИХ статусов (forward-only) — защита
 * от случайного отката назад.
 *
 * Если следующих статусов нет (DONE / CANCELLED / REFUNDED) — пустая клавиатура,
 * она удаляется Telegram'ом.
 */
export function buildKeyboard(currentStatus: OrderStatus, orderId: string): InlineKeyboardMarkup {
  const curIdx = STATUS_FLOW.indexOf(currentStatus)
  const buttons = ACTION_BUTTONS
    .filter((b) => STATUS_FLOW.indexOf(b.status) > curIdx)
    .map((b) => ({ text: b.text, callback_data: `status:${b.status}:${orderId}` }))

  if (!buttons.length) return { inline_keyboard: [] }

  // Разбиваем на строки по 2 кнопки:
  // 4 → [[0,1],[2,3]]  3 → [[0,1],[2]]  2 → [[0],[1]]  1 → [[0]]
  const rows: (typeof buttons)[] = []
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2))
  }
  return { inline_keyboard: rows }
}

// ───────────────────────────────────────────────────────────
// ── КАТАЛОГ: маппинги и helpers (Этап 4)
// ───────────────────────────────────────────────────────────

/** Русские лейблы категорий — для UI бота. */
export const CATEGORY_LABEL: Record<Category, string> = {
  BOUQUET: 'Сборный',
  MONO:    'Моно',
  BOX:     'Коробка',
  BASKET:  'Корзина',
}

/** Эмодзи-иконка статуса товара — для компактного отображения в списке. */
export const STATUS_ICON: Record<ProductStatus, string> = {
  AVAILABLE:    '✅',
  OUT_OF_STOCK: '❌',
  HIDDEN:       '🙈',
}

/** Русские лейблы статусов товара — для развёрнутой карточки. */
export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  AVAILABLE:    'В наличии',
  OUT_OF_STOCK: 'Нет в наличии',
  HIDDEN:       'Скрыт',
}

// ───────────────────────────────────────────────────────────
// ── /add WIZARD: клавиатуры шагов
// ───────────────────────────────────────────────────────────

/**
 * Шаг 1 — загрузка фото. «Готово (N)» показывает счётчик.
 * Если 0 фото — кнопка всё равно есть, но wizard её игнорирует
 * (повторно просит фото). Дешевле, чем динамически перерисовывать клавиатуру.
 */
export function addPhotosKeyboard(count: number): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: `✅ Готово (${count})`, callback_data: 'add:done'   }],
      [{ text: '❌ Отмена',            callback_data: 'add:cancel' }],
    ],
  }
}

/** Шаг 3 — выбор категории. 2×2 как в дизайне фронтенда. */
export function addCategoryKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: CATEGORY_LABEL.BOUQUET, callback_data: 'cat:BOUQUET' },
        { text: CATEGORY_LABEL.MONO,    callback_data: 'cat:MONO'    },
      ],
      [
        { text: CATEGORY_LABEL.BOX,     callback_data: 'cat:BOX'     },
        { text: CATEGORY_LABEL.BASKET,  callback_data: 'cat:BASKET'  },
      ],
      [{ text: '❌ Отмена', callback_data: 'add:cancel' }],
    ],
  }
}

/** Шаги 5-7 — опциональные текстовые поля (description, composition, care). */
export function addSkipKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '⏭ Пропустить', callback_data: 'add:skip'   }],
      [{ text: '❌ Отмена',    callback_data: 'add:cancel' }],
    ],
  }
}

/** Шаг 8 — финальное подтверждение публикации. */
export function addConfirmKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '✅ Опубликовать', callback_data: 'add:publish' },
        { text: '❌ Отмена',       callback_data: 'add:cancel'  },
      ],
    ],
  }
}

// ───────────────────────────────────────────────────────────
// ── /products: список + меню товара
// ───────────────────────────────────────────────────────────

/** Размер страницы в /products. */
export const PRODUCTS_PAGE_SIZE = 5

/**
 * Формирует одну строчку-кнопку для товара в списке /products.
 * Формат: `Название — 150.00 BYN ✅⭐`
 *
 * Длина текста ограничена для аккуратного отображения. cuid укладывается
 * в callback_data с запасом (`prod:open:<25>` ≈ 35 байт; лимит 64).
 */
function productListButton(p: Pick<Product, 'id' | 'name' | 'basePrice' | 'discountPrice' | 'status' | 'featuredInVitrina'>) {
  const price = ((p.discountPrice ?? p.basePrice) / 100).toFixed(2)
  const vitrina = p.featuredInVitrina ? '⭐' : ''
  const status  = STATUS_ICON[p.status]
  // Обрезаем имя, чтобы строка не выходила слишком длинной (Telegram сам
  // переносит, но «телега» из 60 символов в одной кнопке — некрасиво).
  const name = p.name.length > 28 ? p.name.slice(0, 27) + '…' : p.name
  return { text: `${name} — ${price} BYN ${status}${vitrina}`.trim(), callback_data: `prod:open:${p.id}` }
}

/**
 * Клавиатура списка товаров с пагинацией.
 * Ряды: по одной кнопке на товар + ряд пагинации внизу.
 */
export function productsListKeyboard(
  products: ReadonlyArray<Pick<Product, 'id' | 'name' | 'basePrice' | 'discountPrice' | 'status' | 'featuredInVitrina'>>,
  page: number,
  totalPages: number,
): InlineKeyboardMarkup {
  const rows: { text: string; callback_data: string }[][] = products.map((p) => [productListButton(p)])

  if (totalPages > 1) {
    const nav: { text: string; callback_data: string }[] = []
    if (page > 1) nav.push({ text: '← пред', callback_data: `prod:page:${page - 1}` })
    nav.push({ text: `${page}/${totalPages}`, callback_data: 'prod:noop' })
    if (page < totalPages) nav.push({ text: 'след →', callback_data: `prod:page:${page + 1}` })
    rows.push(nav)
  }

  return { inline_keyboard: rows }
}

/**
 * Меню управления одним товаром (открывается по клику на товар в списке).
 *
 * 5 рядов:
 *   [✏️ Название] [💰 Цена]
 *   [🏷 Скидка]   [📸 Фото]
 *   [🙈 Скрыть] или [✅ Показать]   ← одна кнопка-переключатель
 *   [⭐ Витрина: вкл/выкл]
 *   [🗑 Удалить]  [← Назад]
 */
export function productMenuKeyboard(
  product: Pick<Product, 'id' | 'status' | 'featuredInVitrina'>,
): InlineKeyboardMarkup {
  const id = product.id

  // Простой переключатель: AVAILABLE → Скрыть (→ OUT_OF_STOCK),
  // всё остальное (OUT_OF_STOCK / HIDDEN) → Показать (→ AVAILABLE).
  const toggleButton = product.status === 'AVAILABLE'
    ? { text: '🙈 Скрыть',    callback_data: `prod:status:${id}:OUT_OF_STOCK` }
    : { text: '✅ Показать',  callback_data: `prod:status:${id}:AVAILABLE`    }

  const vitrinaText = product.featuredInVitrina ? '⭐ Витрина: убрать' : '⭐ Витрина: добавить'

  return {
    inline_keyboard: [
      [
        { text: '✏️ Название', callback_data: `prod:edit:name:${id}`     },
        { text: '💰 Цена',     callback_data: `prod:edit:price:${id}`    },
      ],
      [
        { text: '🏷 Скидка',   callback_data: `prod:edit:discount:${id}` },
        { text: '📸 Фото',     callback_data: `prod:edit:photos:${id}`   },
      ],
      [toggleButton],
      [{ text: vitrinaText,    callback_data: `prod:vitrina:${id}` }],
      [
        { text: '🗑 Удалить',  callback_data: `prod:delete:${id}` },
        { text: '← Назад',     callback_data: 'prod:back'         },
      ],
    ],
  }
}

/** Подтверждение удаления — два варианта на одной строке. */
export function deleteConfirmKeyboard(id: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '⚠️ Точно удалить', callback_data: `prod:delete-confirm:${id}` },
        { text: '↩️ Назад',         callback_data: `prod:open:${id}`           },
      ],
    ],
  }
}
