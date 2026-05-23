import type { CallbackQueryContext, Context } from 'grammy'
import type { OrderStatus } from '@prisma/client'

import { prisma } from '@/lib/db'
import { formatOrderMessage, type EventWithActor } from '../format'
import { buildKeyboard, STATUS_FLOW } from '../keyboard'

/**
 * Загружает все события заказа и подтягивает имена флористов из AdminUser.
 * Используется для рендера строк истории в сообщении заказа.
 */
async function loadEventsWithActors(orderId: string): Promise<EventWithActor[]> {
  const events = await prisma.orderEvent.findMany({
    where:   { orderId },
    orderBy: { createdAt: 'asc' },
  })

  // Собираем уникальные TG ID акторов (может быть null для системных событий)
  const tgIds = [...new Set(
    events.filter((e) => e.actorTgId !== null).map((e) => e.actorTgId!),
  )]

  const admins = tgIds.length > 0
    ? await prisma.adminUser.findMany({
        where:  { telegramId: { in: tgIds } },
        select: { telegramId: true, name: true },
      })
    : []

  // BigInt не работает как ключ Map напрямую — используем строку
  const nameMap = new Map(admins.map((a) => [String(a.telegramId), a.name]))

  return events.map((e) => ({
    status:    e.status,
    createdAt: e.createdAt,
    actorName: e.actorTgId ? (nameMap.get(String(e.actorTgId)) ?? null) : null,
  }))
}

/**
 * Хендлер callback'ов вида `status:<NEW_STATUS>:<ORDER_ID>`.
 *
 * Регистрируется в bot.ts через `bot.callbackQuery(/^status:([A-Z_]+):(.+)$/, ...)`.
 * Auth-middleware (см. bot.ts) уже отфильтровал чужих пользователей —
 * в ctx гарантированно есть AdminUser.
 */
export async function handleStatusCallback(ctx: CallbackQueryContext<Context>): Promise<void> {
  // ctx.match для regex-роутинга — это string | RegExpMatchArray.
  // grammY гарантирует RegExpMatchArray, когда зарегистрирована regex.
  const match = ctx.match as RegExpMatchArray
  const rawStatus = match[1]
  const orderId   = match[2]

  if (!rawStatus || !orderId) {
    await ctx.answerCallbackQuery('Битый callback')
    return
  }

  const newStatus = rawStatus as OrderStatus

  // Защита от мусорных payload'ов (например, опечатка в callback_data).
  if (!STATUS_FLOW.includes(newStatus)) {
    await ctx.answerCallbackQuery('Неизвестный статус')
    return
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) {
    await ctx.answerCallbackQuery('Заказ не найден')
    return
  }

  // Идемпотентность: уже в этом статусе — ничего не делаем (например, двойной клик).
  if (order.status === newStatus) {
    await ctx.answerCallbackQuery('Уже в этом статусе')
    return
  }

  const actorTgId = BigInt(ctx.from.id)

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    }),
    prisma.orderEvent.create({
      data: { orderId, status: newStatus, actorTgId },
    }),
  ])

  // Перечитываем заказ с items и всю историю событий для рендера строк
  // «✅ Принял: Имя (19 мая 15:13)» в конце сообщения.
  const [updated, events] = await Promise.all([
    prisma.order.findUnique({ where: { id: orderId }, include: { items: true } }),
    loadEventsWithActors(orderId),
  ])
  if (!updated) {
    await ctx.answerCallbackQuery('Заказ исчез')
    return
  }

  await ctx.editMessageText(formatOrderMessage(updated, events), {
    reply_markup: buildKeyboard(newStatus, orderId),
  })
  await ctx.answerCallbackQuery('Статус обновлён ✓')
}
