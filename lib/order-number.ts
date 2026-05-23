import { format } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { startOfDay, endOfDay } from 'date-fns'
import type { PrismaClient } from '@prisma/client'

const TZ = 'Europe/Minsk'

/**
 * Генерирует уникальный публичный номер заказа в формате LAV-YYMMDD-NNNN.
 * NNNN — порядковый номер в рамках Минского календарного дня (UTC-границы дня в Минске).
 */
export async function generateOrderNumber(
  date: Date,
  prisma: PrismaClient,
): Promise<string> {
  const dayMinsk = toZonedTime(date, TZ)
  const datePart = format(dayMinsk, 'yyMMdd')

  // Границы Минского дня в UTC
  const startMinsk = startOfDay(dayMinsk)
  const endMinsk   = endOfDay(dayMinsk)
  const startUtc   = fromZonedTime(startMinsk, TZ)
  const endUtc     = fromZonedTime(endMinsk, TZ)

  const count = await prisma.order.count({
    where: { createdAt: { gte: startUtc, lte: endUtc } },
  })

  const num = String(count + 1).padStart(4, '0')
  return `LAV-${datePart}-${num}`
}
