import {
  addDays,
  addHours,
  addMinutes,
  format,
  isAfter,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from 'date-fns'
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz'

// ── Constants ────────────────────────────────────────────
export const TZ        = 'Europe/Minsk'
export const OPEN_H    = 9    // 09:00
export const CLOSE_H   = 20   // 20:00 inclusive
export const LEAD_H    = 3    // минимум 3 часа от now
export const SLOT_MIN  = 30   // шаг слотов в минутах

/**
 * Исключение расписания на конкретную дату.
 * Структурный тип (подмножество Prisma-модели `ScheduleException`), чтобы:
 *  - роут мог передать результат `prisma.scheduleException.findMany()` как есть;
 *  - тесты могли передавать «голые» объекты без id/createdAt.
 */
export interface DayException {
  date:     Date           // UTC-полночь, ключ = календарная дата Минска
  mode:     'CLOSED' | 'SHORTENED'
  opensAt:  string | null  // "11:00"
  closesAt: string | null  // "16:00"
}

/**
 * Парсит строку "HH:MM" → { h, m }. Возвращает null при невалидном формате
 * или выходе за пределы (часы 0–23, минуты 0–59). Реиспользуется в wizard'е
 * расписания (там сверху накладывается правило «минуты 0 или 30»).
 */
export function parseHHMM(s: string): { h: number; m: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(s.trim())
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return { h, m }
}

// ── Helpers ──────────────────────────────────────────────

/** Возвращает дату в Минске с обнулёнными секундами/мс, выставленными hh:mm. */
function atTimeMinsk(dayMinsk: Date, h: number, m: number): Date {
  return setMilliseconds(setSeconds(setMinutes(setHours(dayMinsk, h), m), 0), 0)
}

/**
 * Округляет дату ВВЕРХ до ближайших `step` минут (секунды + мс обнуляются).
 * Если уже выровнено (нет секунд/мс и минуты делятся на step) — возвращает как есть.
 */
function ceilToStep(date: Date, step: number): Date {
  const ms = date.getMilliseconds()
  const sec = date.getSeconds()
  const min = date.getMinutes()

  // Уже выровнено
  if (ms === 0 && sec === 0 && min % step === 0) return date

  // Обнулить секунды/мс
  const cleaned = setMilliseconds(setSeconds(date, 0), 0)
  // Сколько минут добавить, чтобы попасть в следующую границу шага
  const remainder = min % step
  const add = remainder === 0 ? 0 : step - remainder
  return addMinutes(cleaned, add)
}

// ── Main ─────────────────────────────────────────────────

/**
 * Генерирует список доступных временных слотов в UTC.
 *
 * Алгоритм (Europe/Minsk, 9:00–20:00, лид-тайм 3 часа, шаг 30 минут):
 * - Лид-тайм применяется ВСЕГДА:
 *   - Для дня 0 (сегодня): earliest = now + 3ч.
 *   - Для остальных дней: earliest = (09:00 открытие) + 3ч = 12:00.
 * - Если earliest > 20:00 этого дня — день пропускается.
 * - earliest округляется ВВЕРХ до ближайших 30 минут (но не раньше 09:00).
 * - Слоты генерируются с шагом 30 минут до 20:00 ВКЛЮЧИТЕЛЬНО.
 *
 * Edge cases:
 *  generateSlots(09:00 Minsk) → первый слот 12:00 сегодня
 *  generateSlots(17:00 Minsk) → первый слот 20:00 сегодня
 *  generateSlots(17:31 Minsk) → сегодня нет слотов, первый = завтра 12:00
 *  generateSlots(23:00 Minsk) → первый слот = завтра 12:00
 */
export function generateSlots(
  nowUtc: Date,
  daysAhead = 7,
  exceptions: DayException[] = [],
): Date[] {
  const nowMinsk = toZonedTime(nowUtc, TZ)
  const slots: Date[] = []

  // Индекс исключений по строковому ключу yyyy-MM-dd.
  // Дата исключения хранится как UTC-полночь Минской даты → форматируем в UTC.
  const excByDay = new Map<string, DayException>()
  for (const exc of exceptions) {
    excByDay.set(formatInTimeZone(exc.date, 'UTC', 'yyyy-MM-dd'), exc)
  }

  for (let d = 0; d < daysAhead; d++) {
    const dayMinsk = addDays(nowMinsk, d)

    // Исключение для этого дня (ключ — Минская календарная дата).
    const exc = excByDay.get(format(dayMinsk, 'yyyy-MM-dd'))

    // Выходной — пропускаем день целиком.
    if (exc?.mode === 'CLOSED') continue

    // Часы открытия/закрытия: по умолчанию 09:00–20:00, для SHORTENED
    // переопределяются opensAt/closesAt (каждое независимо, если задано).
    let openH = OPEN_H,  openM = 0
    let closeH = CLOSE_H, closeM = 0
    if (exc?.mode === 'SHORTENED') {
      const open = exc.opensAt  ? parseHHMM(exc.opensAt)  : null
      const close = exc.closesAt ? parseHHMM(exc.closesAt) : null
      if (open)  { openH  = open.h;  openM  = open.m  }
      if (close) { closeH = close.h; closeM = close.m }
    }

    const dayOpen  = atTimeMinsk(dayMinsk, openH, openM)
    const dayClose = atTimeMinsk(dayMinsk, closeH, closeM)

    // Самое раннее возможное время для этого дня (в Минске).
    // Лид-тайм применяется и к будущим дням — от момента открытия магазина.
    const earliest = d === 0
      ? addHours(nowMinsk, LEAD_H)
      : addHours(dayOpen, LEAD_H)

    // Если earliest строго после закрытия — пропускаем день
    if (isAfter(earliest, dayClose)) continue

    // Стартовая точка: max(earliest, dayOpen), округлённая вверх до 30 минут
    const baseline = isAfter(dayOpen, earliest) ? dayOpen : earliest
    let cursor    = ceilToStep(baseline, SLOT_MIN)

    // На всякий случай: если округление выкинуло нас за пределы — пропускаем
    if (isAfter(cursor, dayClose)) continue

    // Генерируем слоты до 20:00 включительно
    while (!isAfter(cursor, dayClose)) {
      // Конвертируем минское локальное время → UTC
      slots.push(fromZonedTime(cursor, TZ))
      cursor = addMinutes(cursor, SLOT_MIN)
    }
  }

  return slots
}
