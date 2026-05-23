/**
 * Управление AdminUser: wizard /addadmin + хендлеры /admins и /removeadmin.
 * Все команды доступны только OWNER'у (проверка — в bot.ts через ownerOnly).
 */

import type { AdminRole } from '@prisma/client'
import type { CallbackQueryContext, CommandContext, Context } from 'grammy'

import { prisma } from '@/lib/db'
import type { AdminContext, AdminConversation } from '../types'

// ── /admins ──────────────────────────────────────────────────

const ROLE_LABEL: Record<AdminRole, string> = {
  OWNER:   '👑 Владелец',
  FLORIST: '💐 Флорист',
}

/** /admins — текстовый список всех AdminUser. */
export async function listAdmins(ctx: CommandContext<AdminContext>): Promise<void> {
  const admins = await prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' } })

  if (admins.length === 0) {
    await ctx.reply('Список администраторов пуст.')
    return
  }

  const lines = admins.map((a, i) => {
    const role   = ROLE_LABEL[a.role]
    const status = a.active ? '✅' : '🚫'
    return `${i + 1}. ${status} ${a.name} (${role})\n   TG ID: ${a.telegramId}`
  })

  await ctx.reply(`Администраторы (${admins.length}):\n\n${lines.join('\n\n')}`)
}

// ── /removeadmin ──────────────────────────────────────────────

/**
 * /removeadmin — inline-список активных админов (кроме вызвавшего).
 * Клик → подтверждение; подтверждение → деактивация (active: false).
 *
 * Callback-форматы:
 *   rmadmin:ask:<id>      — спросить подтверждение
 *   rmadmin:confirm:<id>  — выполнить деактивацию
 *   rmadmin:cancel        — отмена
 */
export async function listAdminsForRemoval(ctx: CommandContext<AdminContext>): Promise<void> {
  const callerId = ctx.from?.id
  if (!callerId) return

  const admins = await prisma.adminUser.findMany({
    where: {
      active:     true,
      telegramId: { not: BigInt(callerId) }, // нельзя удалить себя
    },
    orderBy: { createdAt: 'asc' },
  })

  if (admins.length === 0) {
    await ctx.reply('Нет других активных администраторов.')
    return
  }

  const rows = admins.map((a) => [{
    text:          `❌ ${a.name} — ${ROLE_LABEL[a.role]}`,
    callback_data: `rmadmin:ask:${a.id}`,
  }])

  await ctx.reply('Выбери администратора для удаления:', {
    reply_markup: { inline_keyboard: rows },
  })
}

/** Роутер для callback'ов rmadmin:*. */
export async function handleRemoveAdminCallback(
  ctx: CallbackQueryContext<AdminContext>,
): Promise<void> {
  const data  = ctx.callbackQuery.data ?? ''
  const parts = data.split(':')
  const action = parts[1]

  switch (action) {
    case 'cancel': {
      await ctx.answerCallbackQuery()
      await ctx.editMessageText('Отменено.')
      return
    }

    case 'ask': {
      const id = parts[2]
      if (!id) { await ctx.answerCallbackQuery('Битый callback'); return }

      const admin = await prisma.adminUser.findUnique({ where: { id } })
      if (!admin) {
        await ctx.answerCallbackQuery('Администратор не найден')
        return
      }

      await ctx.editMessageText(
        `Удалить «${admin.name}» (${ROLE_LABEL[admin.role]})?\n` +
        `TG ID: ${admin.telegramId}\n\n` +
        `Запись будет полностью удалена из БД.`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '🗑 Удалить', callback_data: `rmadmin:confirm:${id}` },
              { text: '↩️ Назад',  callback_data: 'rmadmin:cancel'        },
            ]],
          },
        },
      )
      await ctx.answerCallbackQuery()
      return
    }

    case 'confirm': {
      const id = parts[2]
      if (!id) { await ctx.answerCallbackQuery('Битый callback'); return }

      const admin = await prisma.adminUser.findUnique({ where: { id } })
      if (!admin) {
        await ctx.answerCallbackQuery('Администратор уже удалён')
        await ctx.editMessageText('Администратор уже был удалён ранее.')
        return
      }

      await prisma.adminUser.delete({ where: { id } })
      await ctx.answerCallbackQuery('Удалён ✓')
      await ctx.editMessageText(
        `🗑 «${admin.name}» (${ROLE_LABEL[admin.role]}) удалён.\n` +
        `TG ID: ${admin.telegramId}`,
      )
      return
    }

    default:
      await ctx.answerCallbackQuery('Неизвестное действие')
  }
}

// ── /editadmin ────────────────────────────────────────────────

/**
 * /editadmin — показывает активных админов кнопками, затем меняет роль.
 *
 * Callback-форматы:
 *   editadmin:pick:<id>         — открыть меню смены роли для конкретного админа
 *   editadmin:set:<id>:OWNER    — назначить роль OWNER
 *   editadmin:set:<id>:FLORIST  — назначить роль FLORIST
 *   editadmin:cancel            — закрыть
 */
export async function listAdminsForEdit(ctx: CommandContext<AdminContext>): Promise<void> {
  const admins = await prisma.adminUser.findMany({
    where:   { active: true },
    orderBy: { createdAt: 'asc' },
  })

  if (admins.length === 0) {
    await ctx.reply('Нет активных администраторов.')
    return
  }

  const rows = admins.map((a) => [{
    text:          `${ROLE_LABEL[a.role]} ${a.name}`,
    callback_data: `editadmin:pick:${a.id}`,
  }])

  await ctx.reply('Выбери администратора для изменения роли:', {
    reply_markup: { inline_keyboard: rows },
  })
}

/** Роутер для callback'ов editadmin:*. */
export async function handleEditAdminCallback(
  ctx: CallbackQueryContext<AdminContext>,
): Promise<void> {
  const data  = ctx.callbackQuery.data ?? ''
  const parts = data.split(':')
  const action = parts[1]

  switch (action) {
    case 'cancel': {
      await ctx.answerCallbackQuery()
      await ctx.editMessageText('Отменено.')
      return
    }

    case 'pick': {
      const id = parts[2]
      if (!id) { await ctx.answerCallbackQuery('Битый callback'); return }

      const admin = await prisma.adminUser.findUnique({ where: { id } })
      if (!admin) { await ctx.answerCallbackQuery('Администратор не найден'); return }

      await ctx.editMessageText(
        `${admin.name}\nТекущая роль: ${ROLE_LABEL[admin.role]}\n\nВыбери новую роль:`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '👑 Сделать владельцем', callback_data: `editadmin:set:${id}:OWNER`   },
                { text: '💐 Сделать флористом',  callback_data: `editadmin:set:${id}:FLORIST` },
              ],
              [{ text: '↩️ Отмена', callback_data: 'editadmin:cancel' }],
            ],
          },
        },
      )
      await ctx.answerCallbackQuery()
      return
    }

    case 'set': {
      const id   = parts[2]
      const role = parts[3] as AdminRole | undefined
      if (!id || !role || !['OWNER', 'FLORIST'].includes(role)) {
        await ctx.answerCallbackQuery('Битый callback')
        return
      }

      const admin = await prisma.adminUser.findUnique({ where: { id } })
      if (!admin) { await ctx.answerCallbackQuery('Администратор не найден'); return }

      if (admin.role === role) {
        await ctx.answerCallbackQuery('Уже эта роль')
        return
      }

      await prisma.adminUser.update({ where: { id }, data: { role } })
      await ctx.answerCallbackQuery('Роль изменена ✓')
      await ctx.editMessageText(
        `✅ ${admin.name}: роль изменена на ${ROLE_LABEL[role]}.`,
      )
      return
    }

    default:
      await ctx.answerCallbackQuery('Неизвестное действие')
  }
}

// ── /addadmin wizard ──────────────────────────────────────────

const ROLE_KEYBOARD = {
  inline_keyboard: [[
    { text: '👑 Владелец', callback_data: 'role:OWNER'   },
    { text: '💐 Флорист',  callback_data: 'role:FLORIST' },
  ]],
}

const CONFIRM_KEYBOARD = {
  inline_keyboard: [[
    { text: '✅ Добавить', callback_data: 'addadmin:confirm' },
    { text: '❌ Отмена',   callback_data: 'addadmin:cancel'  },
  ]],
}

export async function addAdminWizard(
  conversation: AdminConversation,
  ctx: Context,
): Promise<void> {
  // ── Шаг 1: числовой Telegram ID ─────────────────────────
  const ID_PROMPT =
    'Введи числовой Telegram ID нового администратора.\n\n' +
    'Чтобы узнать свой ID, нужно написать боту @userinfobot — он сразу ответит числом.'

  await ctx.reply(ID_PROMPT)

  let telegramId: bigint
  while (true) {
    const textCtx = await conversation.waitFor('message:text')
    const raw = textCtx.message.text.trim()
    const num = Number(raw)
    if (Number.isInteger(num) && num > 0) {
      telegramId = BigInt(num)
      break
    }
    await textCtx.reply(ID_PROMPT)
  }

  // ── Шаг 2: Имя ───────────────────────────────────────────
  await ctx.reply('Введи имя администратора:')

  let name = ''
  while (true) {
    const textCtx = await conversation.waitFor('message:text')
    const raw = textCtx.message.text.trim()
    if (raw.length < 2 || raw.length > 60) {
      await textCtx.reply('Длина имени: 2–60 символов. Попробуй ещё раз.')
      continue
    }
    name = raw
    break
  }

  // ── Шаг 3: Роль ──────────────────────────────────────────
  await ctx.reply('Выбери роль:', { reply_markup: ROLE_KEYBOARD })

  let role: AdminRole
  while (true) {
    const cbCtx = await conversation.waitForCallbackQuery(/^(role:(OWNER|FLORIST)|addadmin:cancel)$/)
    await cbCtx.answerCallbackQuery()
    const data = cbCtx.callbackQuery.data
    if (data === 'addadmin:cancel') {
      await cbCtx.reply('Отменено.')
      return
    }
    role = data.slice('role:'.length) as AdminRole
    break
  }

  // ── Шаг 4: Подтверждение ─────────────────────────────────
  await ctx.reply(
    `Проверь данные:\n\n` +
    `Имя: ${name}\n` +
    `TG ID: ${telegramId}\n` +
    `Роль: ${ROLE_LABEL[role]}`,
    { reply_markup: CONFIRM_KEYBOARD },
  )

  const confirmCtx = await conversation.waitForCallbackQuery(/^addadmin:(confirm|cancel)$/)
  await confirmCtx.answerCallbackQuery()

  if (confirmCtx.callbackQuery.data === 'addadmin:cancel') {
    await confirmCtx.reply('Отменено.')
    return
  }

  // ── Upsert ────────────────────────────────────────────────
  await conversation.external(() =>
    prisma.adminUser.upsert({
      where:  { telegramId },
      create: { telegramId, name, role, active: true },
      update: { name, role, active: true },
    }),
  )

  await confirmCtx.reply(
    `✅ Администратор «${name}» (${ROLE_LABEL[role]}) добавлен.\n\n` +
    `Попроси этого человека написать боту любое сообщение — тогда бот его узнает и разрешит доступ.`,
  )
}

// ── /renameadmin wizard ───────────────────────────────────────

/**
 * Шаг 1: показывает inline-список активных админов.
 * Шаг 2: после выбора conversation ждёт новое имя и обновляет запись.
 *
 * Реализован как conversation, потому что между выбором кнопки и
 * получением текстового ответа нужно сохранять выбранный adminId.
 *
 * Callback-формат одного шага: `rename:pick:<id>`.
 */
export async function renameAdminWizard(
  conversation: AdminConversation,
  ctx: Context,
): Promise<void> {
  // ── Шаг 1: список ────────────────────────────────────────
  const admins = await conversation.external(() =>
    prisma.adminUser.findMany({ where: { active: true }, orderBy: { createdAt: 'asc' } }),
  )

  if (admins.length === 0) {
    await ctx.reply('Нет активных администраторов.')
    return
  }

  const rows = admins.map((a) => [{
    text:          `${ROLE_LABEL[a.role]} ${a.name}`,
    callback_data: `rename:pick:${a.id}`,
  }])
  rows.push([{ text: '❌ Отмена', callback_data: 'rename:cancel' }])

  await ctx.reply('Выбери администратора для переименования:', {
    reply_markup: { inline_keyboard: rows },
  })

  const pickCtx = await conversation.waitForCallbackQuery(/^rename:(pick:.+|cancel)$/)
  await pickCtx.answerCallbackQuery()

  if (pickCtx.callbackQuery.data === 'rename:cancel') {
    await pickCtx.reply('Отменено.')
    return
  }

  const adminId = pickCtx.callbackQuery.data.slice('rename:pick:'.length)

  const admin = await conversation.external(() =>
    prisma.adminUser.findUnique({ where: { id: adminId } }),
  )
  if (!admin) {
    await pickCtx.reply('Администратор не найден — возможно, уже удалён.')
    return
  }

  // ── Шаг 2: новое имя ─────────────────────────────────────
  await pickCtx.reply(`Введи новое имя для «${admin.name}»:`)

  let newName = ''
  while (true) {
    const textCtx = await conversation.waitFor('message:text')
    const raw = textCtx.message.text.trim()
    if (raw.length < 2 || raw.length > 50) {
      await textCtx.reply('Длина имени: 2–50 символов. Попробуй ещё раз.')
      continue
    }
    newName = raw
    break
  }

  await conversation.external(() =>
    prisma.adminUser.update({ where: { id: adminId }, data: { name: newName } }),
  )

  await ctx.reply(`✅ Имя изменено на «${newName}».`)
}
