import { Bot, type Middleware } from 'grammy'
import { conversations, createConversation } from '@grammyjs/conversations'

import { prisma } from '@/lib/db'
import { handleStatusCallback } from './handlers/status'
import { handleProductCallback, listProducts } from './handlers/products'
import { addProductWizard } from './conversations/add-product'
import { editProductField, editProductPhotos } from './conversations/edit-product'
import {
  addAdminWizard,
  handleEditAdminCallback,
  handleRemoveAdminCallback,
  listAdmins,
  listAdminsForEdit,
  listAdminsForRemoval,
  renameAdminWizard,
} from './conversations/manage-admins'
import {
  addScheduleWizard,
  handleScheduleCallback,
  listSchedule,
} from './conversations/manage-schedule'
import type { AdminContext } from './types'

/**
 * Middleware-гард «только для OWNER».
 * Auth-middleware уже пустил AdminUser (любой роли) — этот проверяет именно роль.
 */
const ownerOnly: Middleware<AdminContext> = async (ctx, next) => {
  const tgId = ctx.from?.id
  if (!tgId) return
  const admin = await prisma.adminUser.findUnique({
    where: { telegramId: BigInt(tgId) },
    select: { role: true },
  })
  if (admin?.role !== 'OWNER') {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery('Только для владельца')
    else if (ctx.message)  await ctx.reply('Команда только для владельца.')
    return
  }
  return next()
}

/**
 * Создаёт инстанс бота и регистрирует middleware + хендлеры.
 * Вызывается ОДИН РАЗ — singleton ниже гарантирует, что hot-reload
 * в dev не плодит дубли callback'ов.
 *
 * Порядок middleware важен:
 *   1) conversations()                — без него createConversation падает
 *   2) authMiddleware                 — режет всех, кроме активных AdminUser
 *   3) createConversation(...)        — регистрация конкретных wizard'ов
 *   4) bot.command / bot.callbackQuery — собственно роутинг
 *
 * Conversations помечены `parallel: true`, чтобы их незахваченные wait'ом
 * update'ы пропускались дальше — иначе wizard /add заблокировал бы
 * status:* callback'и от заказов (Этап 3) пока он активен.
 */
function createBot(): Bot<AdminContext> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set')
  }

  const bot = new Bot<AdminContext>(token)

  // ── 1. Conversations plugin ────────────────────────────
  bot.use(conversations())

  // ── 2. Auth middleware ─────────────────────────────────
  // Любой update проходит только если ctx.from совпадает с активным AdminUser.
  bot.use(async (ctx, next) => {
    const tgId = ctx.from?.id
    if (!tgId) return

    const admin = await prisma.adminUser.findUnique({
      where: { telegramId: BigInt(tgId) },
    })

    if (!admin?.active) {
      if (ctx.callbackQuery) {
        await ctx.answerCallbackQuery('Нет доступа')
      }
      return // не пускаем дальше
    }

    return next()
  })

  // ── 3. Регистрация conversations ───────────────────────
  bot.use(createConversation(addProductWizard,  { id: 'addProductWizard',  parallel: true }))
  bot.use(createConversation(editProductField,  { id: 'editProductField',  parallel: true }))
  bot.use(createConversation(editProductPhotos, { id: 'editProductPhotos', parallel: true }))
  bot.use(createConversation(addAdminWizard,    { id: 'addAdminWizard',    parallel: true }))
  bot.use(createConversation(renameAdminWizard, { id: 'renameAdminWizard', parallel: true }))
  bot.use(createConversation(addScheduleWizard, { id: 'addScheduleWizard', parallel: true }))

  // ── 4. Команды и callback'и ────────────────────────────
  bot.command('add', ownerOnly, async (ctx) => {
    await ctx.conversation.enter('addProductWizard')
  })
  bot.command('products', ownerOnly, listProducts)

  // Управление админами (OWNER-only).
  bot.command('admins',      ownerOnly, listAdmins)
  bot.command('addadmin',    ownerOnly, async (ctx) => {
    await ctx.conversation.enter('addAdminWizard')
  })
  bot.command('removeadmin', ownerOnly, listAdminsForRemoval)
  bot.command('editadmin',    ownerOnly, listAdminsForEdit)
  bot.command('renameadmin',  ownerOnly, async (ctx) => {
    await ctx.conversation.enter('renameAdminWizard')
  })

  // Управление расписанием (OWNER-only).
  bot.command('schedule', ownerOnly, listSchedule)

  // Статус заказа (Этап 3) — оставлено как было.
  bot.callbackQuery(/^status:([A-Z_]+):(.+)$/, handleStatusCallback)

  // Меню каталога (OWNER-only).
  bot.callbackQuery(/^prod:/, ownerOnly, handleProductCallback)

  // Управление админами: callback'и rmadmin:* и editadmin:* (OWNER-only).
  bot.callbackQuery(/^rmadmin:/,   ownerOnly, handleRemoveAdminCallback)
  bot.callbackQuery(/^editadmin:/, ownerOnly, handleEditAdminCallback)

  // Управление расписанием: callback'и sched:* (OWNER-only). Префикс `swiz:`
  // wizard'а сюда не попадает — его перехватывает wait активной conversation.
  bot.callbackQuery(/^sched:/, ownerOnly, handleScheduleCallback)

  // ── Меню команд в Telegram-клиенте ─────────────────────
  // Подсказка в UI; реальный gating всё равно через ownerOnly.
  bot.api.setMyCommands([
    { command: 'add',         description: 'Добавить товар'           },
    { command: 'products',    description: 'Список товаров'           },
    { command: 'admins',      description: 'Список администраторов'   },
    { command: 'addadmin',    description: 'Добавить администратора'  },
    { command: 'editadmin',   description: 'Изменить роль админа'     },
    { command: 'renameadmin', description: 'Переименовать админа'     },
    { command: 'removeadmin', description: 'Удалить админа'           },
    { command: 'schedule',    description: 'Расписание (выходные/часы)' },
  ]).catch((err) => {
    console.error('[telegram] setMyCommands failed:', err)
  })

  // Глобальный лог ошибок — иначе grammY молча проглатывает throw в хендлерах.
  bot.catch((err) => {
    console.error('[telegram] bot error:', err)
  })

  return bot
}

// ── Ленивый синглтон ──────────────────────────────────────
// Инициализация откладывается до первого реального запроса —
// токен недоступен во время `next build`, поэтому нельзя создавать
// Bot на уровне модуля. globalForBot предотвращает дубли при hot-reload в dev.
const globalForBot = globalThis as unknown as { _bot: Bot<AdminContext> | undefined }

export function getBot(): Bot<AdminContext> {
  if (!globalForBot._bot) {
    globalForBot._bot = createBot()
  }
  return globalForBot._bot
}

export type { AdminContext } from './types'
