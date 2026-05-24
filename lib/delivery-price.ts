import { toZonedTime } from 'date-fns-tz'

const TZ = 'Europe/Minsk'

/** Праздничные дни: [месяц 1-based, день] — год не важен */
const HOLIDAYS: readonly [number, number][] = [
  [2,  14],  // 14 февраля
  [3,   8],  // 8 марта
  [8,  31],  // 31 августа
  [9,   1],  // 1 сентября
  [10, 14],  // 14 октября
  [12, 31],  // 31 декабря
  [1,   1],  // 1 января
]

// Обычные дни
const REGULAR_PRICE     = 1_000   // 10 BYN в копейках
const REGULAR_FREE_FROM = 10_000  // 100 BYN в копейках

// Праздничные дни — бесплатной доставки нет
const HOLIDAY_PRICE     = 1_500   // 15 BYN в копейках

/**
 * Возвращает порог бесплатной доставки (копейки) для обычного дня.
 * В праздничные дни бесплатной доставки нет — возвращает null.
 * Используется в UI для информационной подсказки.
 */
export function getDeliveryFreeFrom(isHoliday: boolean): number | null {
  return isHoliday ? null : REGULAR_FREE_FROM
}

/**
 * Определяет, является ли дата праздничной.
 * Дата интерпретируется в таймзоне Europe/Minsk.
 */
export function isHolidayDate(date: Date): boolean {
  const d = toZonedTime(date, TZ)
  const month = d.getMonth() + 1  // 1-based
  const day   = d.getDate()
  return HOLIDAYS.some(([m, dy]) => m === month && dy === day)
}

/**
 * Рассчитывает стоимость доставки в копейках.
 *
 * @param scheduledAt - дата/время доставки (UTC), интерпретируется в Europe/Minsk
 * @param itemsTotal  - стоимость товаров в копейках (включая аддоны)
 * @returns стоимость доставки в копейках; 0 = бесплатно
 */
export function getDeliveryPrice(scheduledAt: Date, itemsTotal: number): number {
  if (isHolidayDate(scheduledAt)) {
    return HOLIDAY_PRICE  // праздники: всегда 15 BYN, порога бесплатности нет
  }
  return itemsTotal >= REGULAR_FREE_FROM ? 0 : REGULAR_PRICE
}
