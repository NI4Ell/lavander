/**
 * Общие типы Telegram-бота.
 *
 * Вынесены в отдельный модуль, чтобы избежать циклов импорта:
 * `bot.ts` импортирует conversations/handlers, а они в свою очередь
 * импортируют только типы — без обратной зависимости на `bot.ts`.
 */

import type { Context } from 'grammy'
import type { Conversation, ConversationFlavor } from '@grammyjs/conversations'

/**
 * Тип контекста ВНЕШНЕЙ middleware-цепочки (то, что видит bot.use(...)).
 *
 * Содержит `ctx.conversation` от плагина conversations, поэтому именно
 * с этим типом создаётся `new Bot<AdminContext>(...)`.
 */
export type AdminContext = ConversationFlavor<Context>

/**
 * Тип контекста ВНУТРИ conversation builder'а.
 *
 * Это обычный grammy Context — без `ctx.conversation` (рекурсия запрещена)
 * и без кастомных middleware-полей внешнего слоя.
 */
export type AdminConversation = Conversation<AdminContext, Context>
