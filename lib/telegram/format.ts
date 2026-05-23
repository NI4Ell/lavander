import { formatInTimeZone } from 'date-fns-tz'
import { ru } from 'date-fns/locale'
import type { Order, OrderItem, OrderStatus } from '@prisma/client'

import { formatPrice } from '@/lib/format'

const TZ = 'Europe/Minsk'

/** Русские лейблы статусов — для заголовка сообщения. */
export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT:  'ожидает оплаты',
  PAID:             'оплачено',
  PREPARING:        'в работе',
  READY:            'готов',
  OUT_FOR_DELIVERY: 'в пути',
  DONE:             'доставлен',
  CANCELLED:        'отменён',
  REFUNDED:         'возврат',
}

/** Действие флориста в строке истории: «✅ Принял», «📦 Собрал» и т.д. */
const EVENT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  PREPARING:        '✅ Принял',
  READY:            '📦 Собрал',
  OUT_FOR_DELIVERY: '🚚 Отправил',
  DONE:             '✓ Доставил',
  CANCELLED:        '❌ Отменил',
  REFUNDED:         '💸 Вернул',
}

/**
 * Одно событие заказа с именем исполнителя — передаётся в `formatOrderMessage`.
 * Данные подтягиваются из `OrderEvent` + `AdminUser` в хендлере статуса.
 */
export type EventWithActor = {
  status:    OrderStatus
  createdAt: Date
  actorName: string | null
}

/** Заказ с включёнными items — то, что приходит из БД через `include: { items: true }`. */
export type OrderWithItems = Order & { items: OrderItem[] }

const DIVIDER = '━━━━━━━━━━━━━━━━━━━━'

/**
 * Форматирует заказ в plain-text сообщение для Telegram.
 * Не использует HTML/Markdown — нет ничего, что нужно экранировать
 * (адреса, имена и текст открытки попадают как есть).
 *
 * @param events  Список событий с именами исполнителей (пусто для нового заказа).
 *                Каждое событие добавляется строкой «✅ Принял: Имя (19 мая 15:13)»
 *                после финального разделителя.
 */
export function formatOrderMessage(order: OrderWithItems, events: EventWithActor[] = []): string {
  const lines: string[] = []

  lines.push(`🌸 НОВЫЙ ЗАКАЗ #${order.publicNumber}`)
  lines.push(DIVIDER)
  lines.push(`💰 Итого: ${formatPrice(order.totalPrice)} (${STATUS_LABEL[order.status]})`)
  lines.push('')

  // ── Items ─────────────────────────────────────
  for (const item of order.items) {
    lines.push(`• ${item.productName} — ${item.quantity} шт × ${formatPrice(item.pricePaid)}`)

    if (item.hasPostcard && item.postcardText) {
      lines.push(`  с открыткой: «${item.postcardText}»`)
    }
    if (item.hasAquabox) lines.push('  + аквабокс')
    if (item.hasBag)     lines.push('  + пакет-переноска')
  }
  lines.push('')

  // ── Доставка / Самовывоз ──────────────────────
  const dateLabel = formatInTimeZone(order.scheduledAt, TZ, 'd MMMM к HH:mm', { locale: ru })

  if (order.deliveryType === 'DELIVERY') {
    lines.push('📍 Доставка')
    if (order.deliveryAddress) lines.push(order.deliveryAddress)
    lines.push(dateLabel)
    lines.push('')
    if (order.recipientName || order.recipientPhone) {
      const parts = [order.recipientName, order.recipientPhone].filter(Boolean).join(', ')
      lines.push(`👤 ${parts}`)
    }
  } else {
    lines.push('🏪 Самовывоз')
    lines.push(dateLabel)
    lines.push('')
    if (order.pickupName) lines.push(`👤 Заберёт: ${order.pickupName}`)
  }

  // ── Контакты ──────────────────────────────────
  lines.push(`📱 Телефон заказчика: ${order.customerPhone}`)

  if (order.photoBeforeSend && order.photoPhone) {
    lines.push(`📷 Фото перед отправкой → ${order.photoPhone}`)
  }

  if (order.comment) {
    lines.push(`💬 Комментарий: ${order.comment}`)
  }

  lines.push(DIVIDER)

  // ── История действий флористов ─────────────────────────────
  // Фильтруем только события с известным action-лейблом (игнорируем
  // PAID, PENDING_PAYMENT — они не результат ручного действия флориста).
  const historyLines = events
    .filter((e) => EVENT_ACTION_LABEL[e.status])
    .map((e) => {
      const action = EVENT_ACTION_LABEL[e.status]!
      const time   = formatInTimeZone(e.createdAt, TZ, 'd MMM HH:mm', { locale: ru })
      const actor  = e.actorName ? `: ${e.actorName}` : ''
      return `${action}${actor} (${time})`
    })

  if (historyLines.length > 0) {
    lines.push(...historyLines)
  }

  return lines.join('\n')
}
