'use client'

import { formatPrice } from '@/lib/format'

interface Props {
  itemsTotal:    number
  deliveryType:  'DELIVERY' | 'PICKUP'
  /** null = слот ещё не выбран, цена ещё не рассчитана (только для DELIVERY) */
  deliveryPrice: number | null
  isHoliday:     boolean
  totalPrice:    number
  disabled:      boolean
  submitting:    boolean
  errorMessage?: string | null
  onSubmit:      () => void
}

export default function OrderSidebar({
  itemsTotal,
  deliveryType,
  deliveryPrice,
  isHoliday,
  totalPrice,
  disabled,
  submitting,
  errorMessage,
  onSubmit,
}: Props) {
  // Строка стоимости доставки
  let deliveryLabel: string
  let deliveryValue: string

  if (deliveryType === 'PICKUP') {
    deliveryLabel = 'Самовывоз'
    deliveryValue = 'бесплатно'
  } else if (deliveryPrice === null) {
    deliveryLabel = 'Доставка'
    deliveryValue = '— рассчитается —'
  } else if (deliveryPrice === 0) {
    deliveryLabel = 'Доставка'
    deliveryValue = 'Бесплатно'
  } else {
    deliveryLabel = 'Доставка'
    deliveryValue = formatPrice(deliveryPrice)
  }

  const showHolidayBadge =
    deliveryType === 'DELIVERY' && isHoliday && deliveryPrice !== null

  return (
    <aside
      className="border-[1.5px] border-ink rounded-[12px] px-[22px] py-[20px] bg-lav-soft sticky top-5 max-md:static"
    >
      <h2 className="text-[24px] text-purple m-0 mb-3 font-normal">оформление</h2>

      <div className="flex justify-between text-[16px] my-[6px]">
        <span>Товары</span>
        <span>{formatPrice(itemsTotal)}</span>
      </div>

      <div className="flex justify-between text-[16px] my-[6px]">
        <span>{deliveryLabel}</span>
        <span
          className={deliveryPrice === null ? 'text-ink-soft text-[14px] self-center' : ''}
        >
          {deliveryValue}
        </span>
      </div>

      {showHolidayBadge && (
        <p className="text-right text-[13px] text-ink-soft m-0 -mt-[2px] mb-1">
          🌸 праздничный тариф
        </p>
      )}

      <hr className="border-0 border-t-[1.5px] border-dashed border-ink/30 my-4" />

      <div className="flex justify-between text-[26px] font-bold text-ink">
        <span>Итого</span>
        <span>{formatPrice(totalPrice)}</span>
      </div>

      {errorMessage && (
        <p className="mt-3 mb-0 text-[14px] text-[#b04a6a]">{errorMessage}</p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || submitting}
        className={[
          'w-full mt-[14px] py-4 px-7 border-[1.5px] border-ink rounded-[8px]',
          'text-[24px] flex items-center justify-center gap-2 transition-opacity',
          'max-md:text-[18px] max-md:py-[14px]',
          disabled || submitting
            ? 'bg-ink/40 text-paper cursor-not-allowed'
            : 'bg-ink text-paper hover:opacity-85 cursor-pointer',
        ].join(' ')}
      >
        {submitting ? 'Создаём заказ…' : 'Оформить заказ'}
      </button>
    </aside>
  )
}
