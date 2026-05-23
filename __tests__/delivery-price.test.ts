import { getDeliveryPrice, isHolidayDate } from '@/lib/delivery-price'

/**
 * Создаёт дату в заданный день (Минское время = UTC+3) в полдень UTC,
 * чтобы избежать краевых случаев с полуночью при конвертации часовых поясов.
 */
function mskNoon(year: number, month: number, day: number): Date {
  // 09:00 UTC = 12:00 Minsk (UTC+3)
  return new Date(Date.UTC(year, month - 1, day, 9, 0, 0))
}

// ─── isHolidayDate ───────────────────────────────────────────

describe('isHolidayDate', () => {
  test('8 марта — праздничный', () => {
    expect(isHolidayDate(mskNoon(2024, 3, 8))).toBe(true)
  })

  test('14 февраля — праздничный', () => {
    expect(isHolidayDate(mskNoon(2024, 2, 14))).toBe(true)
  })

  test('31 августа — праздничный', () => {
    expect(isHolidayDate(mskNoon(2024, 8, 31))).toBe(true)
  })

  test('1 сентября — праздничный', () => {
    expect(isHolidayDate(mskNoon(2024, 9, 1))).toBe(true)
  })

  test('14 октября — праздничный', () => {
    expect(isHolidayDate(mskNoon(2024, 10, 14))).toBe(true)
  })

  test('31 декабря — праздничный', () => {
    expect(isHolidayDate(mskNoon(2024, 12, 31))).toBe(true)
  })

  test('1 января — праздничный', () => {
    expect(isHolidayDate(mskNoon(2024, 1, 1))).toBe(true)
  })

  test('15 марта — обычный', () => {
    expect(isHolidayDate(mskNoon(2024, 3, 15))).toBe(false)
  })

  test('7 марта — обычный (не 8-е)', () => {
    expect(isHolidayDate(mskNoon(2024, 3, 7))).toBe(false)
  })

  test('год не влияет — 8 марта 2000', () => {
    expect(isHolidayDate(mskNoon(2000, 3, 8))).toBe(true)
  })
})

// ─── getDeliveryPrice ────────────────────────────────────────

describe('getDeliveryPrice', () => {
  // Обычные дни
  describe('обычный день', () => {
    const day = mskNoon(2024, 3, 15)  // 15 марта — обычный

    test('сумма < 80 BYN → 10 BYN (1000 коп)', () => {
      expect(getDeliveryPrice(day, 7_999)).toBe(1_000)
    })

    test('сумма ровно 80 BYN → бесплатно', () => {
      expect(getDeliveryPrice(day, 8_000)).toBe(0)
    })

    test('сумма > 80 BYN → бесплатно', () => {
      expect(getDeliveryPrice(day, 10_000)).toBe(0)
    })

    test('пустая корзина (0 коп) → 10 BYN', () => {
      expect(getDeliveryPrice(day, 0)).toBe(1_000)
    })
  })

  // Праздничные дни
  describe('8 марта (праздник)', () => {
    const day = mskNoon(2024, 3, 8)

    test('сумма < 150 BYN → 15 BYN (1500 коп)', () => {
      expect(getDeliveryPrice(day, 14_999)).toBe(1_500)
    })

    test('сумма ровно 150 BYN → бесплатно', () => {
      expect(getDeliveryPrice(day, 15_000)).toBe(0)
    })

    test('сумма > 150 BYN → бесплатно', () => {
      expect(getDeliveryPrice(day, 20_000)).toBe(0)
    })

    test('сумма >= 80 BYN, но < 150 BYN → НЕ бесплатно (праздничный порог)', () => {
      // 80 BYN (8000 коп) достаточно для обычного дня, но не для праздника
      expect(getDeliveryPrice(day, 8_000)).toBe(1_500)
    })
  })

  // Другие праздники
  test('1 января — применяется праздничный тариф', () => {
    const day = mskNoon(2025, 1, 1)
    expect(getDeliveryPrice(day, 5_000)).toBe(1_500)
  })

  test('31 декабря — применяется праздничный тариф', () => {
    const day = mskNoon(2024, 12, 31)
    expect(getDeliveryPrice(day, 5_000)).toBe(1_500)
  })
})
