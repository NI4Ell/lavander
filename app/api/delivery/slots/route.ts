import { NextResponse } from 'next/server'
import { formatInTimeZone } from 'date-fns-tz'
import { ru } from 'date-fns/locale'
import { isSameDay, addDays } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { generateSlots, TZ } from '@/lib/time-slots'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface SlotPayload {
  iso: string
  label: string
}

/**
 * Форматирует UTC-дату слота в человеческий лейбл по Минскому времени:
 *  - Сегодня → "Сегодня, 15:30"
 *  - Завтра → "Завтра, 11:00"
 *  - Остальные → "17 мая, 14:00"
 */
function labelForSlot(slotUtc: Date, nowUtc: Date): string {
  const slotMinsk = toZonedTime(slotUtc, TZ)
  const nowMinsk  = toZonedTime(nowUtc, TZ)
  const tomorrowMinsk = addDays(nowMinsk, 1)

  const time = formatInTimeZone(slotUtc, TZ, 'HH:mm')

  if (isSameDay(slotMinsk, nowMinsk))      return `Сегодня, ${time}`
  if (isSameDay(slotMinsk, tomorrowMinsk)) return `Завтра, ${time}`

  return `${formatInTimeZone(slotUtc, TZ, 'd MMMM', { locale: ru })}, ${time}`
}

export async function GET(): Promise<NextResponse<{ slots: SlotPayload[] }>> {
  const now = new Date()
  const todayUtcMidnight = new Date(`${formatInTimeZone(now, TZ, 'yyyy-MM-dd')}T00:00:00.000Z`)
  const exceptions = await prisma.scheduleException.findMany({
    where: { date: { gte: todayUtcMidnight } },
  })
  const slots = generateSlots(now, 30, exceptions)

  const payload: SlotPayload[] = slots.map((s) => ({
    iso: s.toISOString(),
    label: labelForSlot(s, now),
  }))

  return NextResponse.json({ slots: payload })
}
