import { addDays } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { generateSlots, TZ, type DayException } from '../lib/time-slots'

/** Удобный билдер: дата в Минске через ISO с +03:00 (Минск всегда UTC+3, без DST). */
function minsk(iso: string): Date {
  return new Date(`${iso}:00+03:00`)
}

/** Форматирует UTC-дату в Минском wall-clock — для удобства сравнения в assertions. */
function inMinsk(d: Date): string {
  return formatInTimeZone(d, TZ, 'yyyy-MM-dd HH:mm')
}

describe('generateSlots — edge cases из CLAUDE.md', () => {
  test('09:00 Minsk → первый слот сегодня 12:00', () => {
    const now = minsk('2026-05-18T09:00')
    const slots = generateSlots(now)
    expect(slots.length).toBeGreaterThan(0)
    expect(inMinsk(slots[0]!)).toBe('2026-05-18 12:00')
  })

  test('17:00 Minsk → первый слот сегодня 20:00 (последний возможный)', () => {
    const now = minsk('2026-05-18T17:00')
    const slots = generateSlots(now)
    expect(inMinsk(slots[0]!)).toBe('2026-05-18 20:00')
    // Следующий слот — уже завтра в 12:00 (лид-тайм с открытия)
    expect(inMinsk(slots[1]!)).toBe('2026-05-19 12:00')
  })

  test('17:31 Minsk → сегодня нет слотов (20:31 > 20:00), первый = завтра 12:00', () => {
    const now = minsk('2026-05-18T17:31')
    const slots = generateSlots(now)
    expect(inMinsk(slots[0]!)).toBe('2026-05-19 12:00')
    const todays = slots.filter((s) => inMinsk(s).startsWith('2026-05-18'))
    expect(todays).toHaveLength(0)
  })

  test('23:00 Minsk → сегодня нет слотов, первый = завтра 12:00', () => {
    const now = minsk('2026-05-18T23:00')
    const slots = generateSlots(now)
    expect(inMinsk(slots[0]!)).toBe('2026-05-19 12:00')
    const todays = slots.filter((s) => inMinsk(s).startsWith('2026-05-18'))
    expect(todays).toHaveLength(0)
  })

  test('06:00 Minsk → первый слот сегодня 09:00 (лид-тайм 9:00 = открытие)', () => {
    const now = minsk('2026-05-18T06:00')
    const slots = generateSlots(now)
    expect(inMinsk(slots[0]!)).toBe('2026-05-18 09:00')
  })
})

describe('generateSlots — структурные проверки', () => {
  test('Полный день (d=1) содержит 17 слотов: 12:00…20:00 шагом 30 мин', () => {
    const now = minsk('2026-05-18T06:00')
    const slots = generateSlots(now)
    const tomorrowSlots = slots.filter((s) => inMinsk(s).startsWith('2026-05-19'))
    expect(tomorrowSlots).toHaveLength(17)
    expect(inMinsk(tomorrowSlots[0]!)).toBe('2026-05-19 12:00')
    expect(inMinsk(tomorrowSlots[tomorrowSlots.length - 1]!)).toBe('2026-05-19 20:00')
  })

  test('daysAhead=7: последний слот не дальше now+6 дней', () => {
    const now = minsk('2026-05-18T10:00')
    const slots = generateSlots(now, 7)
    expect(slots.length).toBeGreaterThan(0)
    const last = slots[slots.length - 1]!
    const sixDaysLater = addDays(now, 6)
    expect(formatInTimeZone(last, TZ, 'yyyy-MM-dd')).toBe(
      formatInTimeZone(sixDaysLater, TZ, 'yyyy-MM-dd'),
    )
  })

  test('Все слоты выровнены по 30 минутам и в окне 09:00–20:00', () => {
    const now = minsk('2026-05-18T11:23')
    const slots = generateSlots(now)
    for (const s of slots) {
      const hhmm = formatInTimeZone(s, TZ, 'HH:mm')
      const [h, m] = hhmm.split(':').map(Number)
      expect(m! % 30).toBe(0)
      expect(h!).toBeGreaterThanOrEqual(9)
      // 20:00 — последний допустимый
      expect(h! < 20 || (h === 20 && m === 0)).toBe(true)
    }
  })

  test('11:23 Minsk → первый слот сегодня 14:30 (округление вверх)', () => {
    // 11:23 + 3h = 14:23 → округление вверх до 14:30
    const now = minsk('2026-05-18T11:23')
    const slots = generateSlots(now)
    expect(inMinsk(slots[0]!)).toBe('2026-05-18 14:30')
  })

  test('11:00 Minsk → первый слот сегодня 14:00 (без округления)', () => {
    const now = minsk('2026-05-18T11:00')
    const slots = generateSlots(now)
    expect(inMinsk(slots[0]!)).toBe('2026-05-18 14:00')
  })

  test('Лид-тайм применяется к будущим дням: день d=2 тоже начинается с 12:00', () => {
    const now = minsk('2026-05-18T10:00')
    const slots = generateSlots(now)
    const dayAfterTomorrow = slots.filter((s) => inMinsk(s).startsWith('2026-05-20'))
    expect(dayAfterTomorrow[0] && inMinsk(dayAfterTomorrow[0])).toBe('2026-05-20 12:00')
  })
})

describe('generateSlots — исключения расписания (ScheduleException)', () => {
  /** UTC-полночь Минской даты + режим — структура DayException. */
  const exc = (
    dateStr: string,
    mode: 'CLOSED' | 'SHORTENED',
    opensAt: string | null = null,
    closesAt: string | null = null,
  ): DayException => ({
    date: new Date(`${dateStr}T00:00:00.000Z`),
    mode,
    opensAt,
    closesAt,
  })

  test('CLOSED → у дня ноль слотов, соседний день не задет', () => {
    const now   = minsk('2026-05-18T06:00')
    const slots = generateSlots(now, 7, [exc('2026-05-18', 'CLOSED')])

    const today = slots.filter((s) => inMinsk(s).startsWith('2026-05-18'))
    expect(today).toHaveLength(0)

    // Завтра без исключения — слоты на месте.
    const tomorrow = slots.filter((s) => inMinsk(s).startsWith('2026-05-19'))
    expect(tomorrow.length).toBeGreaterThan(0)
    expect(inMinsk(tomorrow[0]!)).toBe('2026-05-19 12:00')
  })

  test('SHORTENED (11:00–16:00) сегодня → только окно 11:00–16:00', () => {
    // now=06:00 → лид-тайм 09:00 < open 11:00, поэтому первый слот = 11:00.
    const now   = minsk('2026-05-18T06:00')
    const slots = generateSlots(now, 7, [exc('2026-05-18', 'SHORTENED', '11:00', '16:00')])

    const today = slots.filter((s) => inMinsk(s).startsWith('2026-05-18'))
    // 11:00…16:00 шагом 30 мин = 11 слотов.
    expect(today).toHaveLength(11)
    expect(inMinsk(today[0]!)).toBe('2026-05-18 11:00')
    expect(inMinsk(today[today.length - 1]!)).toBe('2026-05-18 16:00')

    // Все слоты внутри окна [11:00, 16:00].
    for (const s of today) {
      const hhmm = formatInTimeZone(s, TZ, 'HH:mm')
      expect(hhmm >= '11:00' && hhmm <= '16:00').toBe(true)
    }
  })

  test('Исключение на другой день → целевой день со стандартным набором', () => {
    const now = minsk('2026-05-18T06:00')
    // Исключение висит на 2026-05-20, а проверяем 2026-05-19 (без исключения).
    const slots = generateSlots(now, 7, [exc('2026-05-20', 'CLOSED')])

    const tomorrow = slots.filter((s) => inMinsk(s).startsWith('2026-05-19'))
    expect(tomorrow).toHaveLength(17) // 12:00…20:00 — стандартный полный день
    expect(inMinsk(tomorrow[0]!)).toBe('2026-05-19 12:00')
    expect(inMinsk(tomorrow[tomorrow.length - 1]!)).toBe('2026-05-19 20:00')

    // А день с исключением — пуст.
    expect(slots.filter((s) => inMinsk(s).startsWith('2026-05-20'))).toHaveLength(0)
  })
})
