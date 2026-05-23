/**
 * Управление расписанием магазина: команда /schedule + wizard добавления
 * исключений (выходной / сокращённый день). Только для OWNER (гард в bot.ts).
 *
 * Архитектура — по образцу manage-admins.ts:
 *   • listSchedule           — /schedule, показывает список + кнопки.
 *   • handleScheduleCallback — роутер callback'ов `sched:*` (добавить/удалить).
 *   • addScheduleWizard      — conversation пошагового ввода (callback'и `swiz:*`).
 *
 * Дата исключения хранится как UTC-полночь Минской календарной даты
 * (см. lib/time-slots.ts::DayException). Все DB-обращения внутри wizard'а
 * обёрнуты в conversation.external — иначе replay-движок плагина выполнит
 * их несколько раз.
 */

import type { ScheduleException, ScheduleMode } from '@prisma/client'
import type { CallbackQueryContext, CommandContext, Context } from 'grammy'
import type { InlineKeyboardMarkup } from 'grammy/types'
import { addDays, format } from 'date-fns'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { ru } from 'date-fns/locale'

import { prisma } from '@/lib/db'
import { TZ, parseHHMM } from '@/lib/time-slots'
import type { AdminContext, AdminConversation } from '../types'

const DAYS_AHEAD = 30
const DATE_COLS  = 7   // кнопок-дат в ряду

// ── Helpers ──────────────────────────────────────────────────

/** Сегодня в виде UTC-полночи Минской даты — нижняя граница выборки. */
function todayUtcMidnight(): Date {
  return new Date(`${formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd')}T00:00:00.000Z`)
}

/** "2026-05-25" → "25 мая" (Минская дата хранится как UTC-полночь). */
function dateLabel(dateUtc: Date): string {
  return formatInTimeZone(dateUtc, 'UTC', 'd MMMM', { locale: ru })
}

type ExceptionLike = Pick<ScheduleException, 'date' | 'mode' | 'opensAt' | 'closesAt'>

/** "25 мая — Выходной" / "1 июня — Сокращённый (11:00–16:00)". */
function formatExceptionLine(exc: ExceptionLike): string {
  if (exc.mode === 'CLOSED') return `${dateLabel(exc.date)} — Выходной`
  return `${dateLabel(exc.date)} — Сокращённый (${exc.opensAt}–${exc.closesAt})`
}

/** Общий рендер списка — переиспользуется в /schedule и в callback-edit. */
async function renderScheduleList(): Promise<{ text: string; keyboard: InlineKeyboardMarkup }> {
  const exceptions = await prisma.scheduleException.findMany({
    where:   { date: { gte: todayUtcMidnight() } },
    orderBy: { date: 'asc' },
  })

  const addBtn = { text: '➕ Добавить', callback_data: 'sched:add' }

  if (exceptions.length === 0) {
    return {
      text: '📅 Расписание исключений:\n\nИсключений нет.',
      keyboard: { inline_keyboard: [[addBtn]] },
    }
  }

  const lines = exceptions.map((e) => `• ${formatExceptionLine(e)}`)
  return {
    text: `📅 Расписание исключений:\n\n${lines.join('\n')}`,
    keyboard: {
      inline_keyboard: [[
        addBtn,
        { text: '🗑 Удалить', callback_data: 'sched:del-list' },
      ]],
    },
  }
}

// ── /schedule ────────────────────────────────────────────────

export async function listSchedule(ctx: CommandContext<AdminContext>): Promise<void> {
  const { text, keyboard } = await renderScheduleList()
  await ctx.reply(text, { reply_markup: keyboard })
}

// ── Роутер callback'ов sched:* ───────────────────────────────

export async function handleScheduleCallback(
  ctx: CallbackQueryContext<AdminContext>,
): Promise<void> {
  const data   = ctx.callbackQuery.data ?? ''
  const parts  = data.split(':')
  const action = parts[1]

  switch (action) {
    case 'add': {
      await ctx.answerCallbackQuery()
      await ctx.conversation.enter('addScheduleWizard')
      return
    }

    case 'del-list': {
      const exceptions = await prisma.scheduleException.findMany({
        where:   { date: { gte: todayUtcMidnight() } },
        orderBy: { date: 'asc' },
      })
      if (exceptions.length === 0) {
        await ctx.answerCallbackQuery('Список пуст')
        const { text, keyboard } = await renderScheduleList()
        await ctx.editMessageText(text, { reply_markup: keyboard })
        return
      }
      const rows = exceptions.map((e) => [{
        text:          `❌ ${formatExceptionLine(e)}`,
        callback_data: `sched:del-ask:${e.id}`,
      }])
      rows.push([{ text: '↩️ Назад', callback_data: 'sched:back' }])
      await ctx.editMessageText('Выбери исключение для удаления:', {
        reply_markup: { inline_keyboard: rows },
      })
      await ctx.answerCallbackQuery()
      return
    }

    case 'del-ask': {
      const id = parts[2]
      if (!id) { await ctx.answerCallbackQuery('Битый callback'); return }
      const exc = await prisma.scheduleException.findUnique({ where: { id } })
      if (!exc) {
        await ctx.answerCallbackQuery('Уже удалено')
        const { text, keyboard } = await renderScheduleList()
        await ctx.editMessageText(text, { reply_markup: keyboard })
        return
      }
      await ctx.editMessageText(
        `Удалить исключение?\n\n${formatExceptionLine(exc)}`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '⚠️ Удалить', callback_data: `sched:del-confirm:${id}` },
              { text: '↩️ Назад',   callback_data: 'sched:back'              },
            ]],
          },
        },
      )
      await ctx.answerCallbackQuery()
      return
    }

    case 'del-confirm': {
      const id = parts[2]
      if (!id) { await ctx.answerCallbackQuery('Битый callback'); return }
      const exc = await prisma.scheduleException.findUnique({ where: { id } })
      if (!exc) {
        await ctx.answerCallbackQuery('Уже удалено')
      } else {
        await prisma.scheduleException.delete({ where: { id } })
        await ctx.answerCallbackQuery('Удалено ✓')
      }
      const { text, keyboard } = await renderScheduleList()
      await ctx.editMessageText(text, { reply_markup: keyboard })
      return
    }

    case 'back': {
      await ctx.answerCallbackQuery()
      const { text, keyboard } = await renderScheduleList()
      await ctx.editMessageText(text, { reply_markup: keyboard })
      return
    }

    default:
      await ctx.answerCallbackQuery('Неизвестное действие')
  }
}

// ── Wizard добавления ────────────────────────────────────────

const MODE_KEYBOARD: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '🚫 Выходной',           callback_data: 'swiz:mode:CLOSED'    },
      { text: '⏰ Сокращённый день',    callback_data: 'swiz:mode:SHORTENED' },
    ],
    [{ text: '❌ Отмена', callback_data: 'swiz:cancel' }],
  ],
}

const CONFIRM_KEYBOARD: InlineKeyboardMarkup = {
  inline_keyboard: [[
    { text: '✅ Сохранить', callback_data: 'swiz:save'   },
    { text: '❌ Отмена',    callback_data: 'swiz:cancel' },
  ]],
}

/** "10:00" → минуты от полуночи. Вход уже провалидирован parseHHMM. */
function toMinutes(hhmm: string): number {
  const p = parseHHMM(hhmm)!
  return p.h * 60 + p.m
}

/**
 * Спрашивает время в формате HH:MM с минутами 00 или 30, циклически
 * переспрашивая при невалидном вводе. Если задан `after` — требует,
 * чтобы введённое время было строго позже него.
 */
async function askTime(
  conversation: AdminConversation,
  ctx: Context,
  prompt: string,
  after?: string,
): Promise<string> {
  await ctx.reply(prompt)
  while (true) {
    const textCtx = await conversation.waitFor('message:text')
    const parsed  = parseHHMM(textCtx.message.text)
    if (!parsed || (parsed.m !== 0 && parsed.m !== 30)) {
      await textCtx.reply('Формат HH:MM, минуты 00 или 30 (например: 10:00 или 10:30). Попробуй ещё раз.')
      continue
    }
    const normalized = `${String(parsed.h).padStart(2, '0')}:${String(parsed.m).padStart(2, '0')}`
    if (after && toMinutes(normalized) <= toMinutes(after)) {
      await textCtx.reply(`Время закрытия должно быть позже открытия (${after}). Попробуй ещё раз.`)
      continue
    }
    return normalized
  }
}

export async function addScheduleWizard(
  conversation: AdminConversation,
  ctx: Context,
): Promise<void> {
  // ── Шаг 1: дата ──────────────────────────────────────────
  // Генерируем доступные даты (30 дней вперёд, минус уже занятые) внутри
  // external — внутри есть new Date() и DB-чтение (не должно реплеиться).
  const available = await conversation.external(async () => {
    const existing = await prisma.scheduleException.findMany({ select: { date: true } })
    const usedKeys = new Set(existing.map((r) => formatInTimeZone(r.date, 'UTC', 'yyyy-MM-dd')))

    const nowMinsk = toZonedTime(new Date(), TZ)
    const opts: { key: string; label: string }[] = []
    for (let d = 0; d < DAYS_AHEAD; d++) {
      const day = addDays(nowMinsk, d)
      const key = format(day, 'yyyy-MM-dd')
      if (usedKeys.has(key)) continue
      opts.push({ key, label: format(day, 'dd.MM') })
    }
    return opts
  })

  if (available.length === 0) {
    await ctx.reply('На ближайшие 30 дней исключения уже заданы для всех дат.')
    return
  }

  const dateRows: { text: string; callback_data: string }[][] = []
  for (let i = 0; i < available.length; i += DATE_COLS) {
    dateRows.push(
      available.slice(i, i + DATE_COLS).map((o) => ({
        text:          o.label,
        callback_data: `swiz:date:${o.key}`,
      })),
    )
  }
  dateRows.push([{ text: '❌ Отмена', callback_data: 'swiz:cancel' }])

  await ctx.reply('Выбери дату:', { reply_markup: { inline_keyboard: dateRows } })

  const dateCtx = await conversation.waitForCallbackQuery(/^swiz:(date:\d{4}-\d\d-\d\d|cancel)$/)
  await dateCtx.answerCallbackQuery()
  if (dateCtx.callbackQuery.data === 'swiz:cancel') { await dateCtx.reply('Отменено.'); return }
  const dateStr = dateCtx.callbackQuery.data.slice('swiz:date:'.length)

  // ── Шаг 2: режим ─────────────────────────────────────────
  await ctx.reply('Выбери режим:', { reply_markup: MODE_KEYBOARD })

  const modeCtx = await conversation.waitForCallbackQuery(/^swiz:(mode:(CLOSED|SHORTENED)|cancel)$/)
  await modeCtx.answerCallbackQuery()
  if (modeCtx.callbackQuery.data === 'swiz:cancel') { await modeCtx.reply('Отменено.'); return }
  const mode = modeCtx.callbackQuery.data.slice('swiz:mode:'.length) as ScheduleMode

  // ── Шаги 3-4: время (только SHORTENED) ───────────────────
  let opensAt:  string | null = null
  let closesAt: string | null = null
  if (mode === 'SHORTENED') {
    opensAt  = await askTime(conversation, ctx, 'Введи время открытия (например: 10:00):')
    closesAt = await askTime(conversation, ctx, 'Введи время закрытия (например: 16:00):', opensAt)
  }

  // ── Шаг 5: подтверждение ─────────────────────────────────
  const dateUtc  = new Date(`${dateStr}T00:00:00.000Z`)
  const summary  = formatExceptionLine({ date: dateUtc, mode, opensAt, closesAt })
  await ctx.reply(`Проверь:\n\n${summary}`, { reply_markup: CONFIRM_KEYBOARD })

  const confirmCtx = await conversation.waitForCallbackQuery(/^swiz:(save|cancel)$/)
  await confirmCtx.answerCallbackQuery()
  if (confirmCtx.callbackQuery.data === 'swiz:cancel') { await confirmCtx.reply('Отменено.'); return }

  // ── Сохранение ───────────────────────────────────────────
  await conversation.external(async () => {
    await prisma.scheduleException.create({
      data: { date: dateUtc, mode, opensAt, closesAt },
    })
  })

  await confirmCtx.reply(`✅ Исключение сохранено:\n${summary}`)
}
