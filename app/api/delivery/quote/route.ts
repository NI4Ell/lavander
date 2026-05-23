import { NextResponse } from 'next/server'
import { getDeliveryPrice, getDeliveryFreeFrom, isHolidayDate } from '@/lib/delivery-price'

/**
 * GET /api/delivery/quote?scheduledAt=<ISO>&itemsTotal=<kopecks>
 *
 * Возвращает расчёт стоимости доставки без персистентности.
 * Итоговая цена ВСЕГДА пересчитывается сервером при POST /api/orders.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const scheduledAtStr  = searchParams.get('scheduledAt')
  const itemsTotalStr   = searchParams.get('itemsTotal')

  if (!scheduledAtStr || !itemsTotalStr) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 })
  }

  const scheduledAt = new Date(scheduledAtStr)
  const itemsTotal  = parseInt(itemsTotalStr, 10)

  if (isNaN(scheduledAt.getTime()) || isNaN(itemsTotal) || itemsTotal < 0) {
    return NextResponse.json({ error: 'invalid_params' }, { status: 400 })
  }

  const holiday       = isHolidayDate(scheduledAt)
  const deliveryPrice = getDeliveryPrice(scheduledAt, itemsTotal)
  const freeFrom      = getDeliveryFreeFrom(holiday)

  return NextResponse.json({
    deliveryPrice,
    isFree:    deliveryPrice === 0,
    isHoliday: holiday,
    freeFrom,
  })
}
