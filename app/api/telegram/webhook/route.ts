import { webhookCallback } from 'grammy'

import { bot } from '@/lib/telegram/bot'

// grammY должен получать каждый update — Next не должен кэшировать ответы.
export const dynamic = 'force-dynamic'

/**
 * POST /api/telegram/webhook
 *
 * `webhookCallback` сам:
 * - читает body как JSON
 * - сверяет заголовок X-Telegram-Bot-Api-Secret-Token с secretToken (если задан)
 *   и возвращает 401 при несовпадении
 * - вызывает bot.handleUpdate(update)
 * - ловит исключения и возвращает 200, чтобы Telegram не делал ретраи
 */
export const POST = webhookCallback(bot, 'std/http', {
  secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
  // Cloudinary-upload может занимать 5–15 сек. Telegram ждёт максимум 60 сек,
  // поэтому ставим 55 сек вместо дефолтных 10. onTimeout:'return' — grammY
  // вернёт пустой ответ вместо throw, если всё же не успеем.
  timeoutMilliseconds: 55_000,
  onTimeout: 'return',
})
