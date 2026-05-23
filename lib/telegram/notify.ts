import { prisma } from '@/lib/db'
import { bot } from './bot'
import { formatOrderMessage } from './format'
import { buildKeyboard } from './keyboard'

/**
 * Отправляет уведомление о новом заказе в групповой чат флористов.
 * Сохраняет message_id в `Order.tgMessageId`, чтобы потом можно было
 * редактировать сообщение из мест, где нет grammY-контекста
 * (bePaid webhook, крон-задачи).
 */
export async function notifyNewOrder(orderId: string): Promise<void> {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId) {
    throw new Error('TELEGRAM_ADMIN_CHAT_ID is not set')
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) {
    console.warn(`[telegram] notifyNewOrder: order ${orderId} not found`)
    return
  }

  const text = formatOrderMessage(order)
  const message = await bot.api.sendMessage(chatId, text, {
    reply_markup: buildKeyboard(order.status, order.id),
  })

  await prisma.order.update({
    where: { id: order.id },
    data: { tgMessageId: message.message_id },
  })
}
