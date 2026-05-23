'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { selectTotal, useCartStore } from '@/store/cart'
import CartItemRow from './CartItemRow'
import DeliveryToggle, { type DeliveryType } from './DeliveryToggle'
import SlotPicker, { type SlotOption } from './SlotPicker'
import PhotoBlock from './PhotoBlock'
import OrderSidebar from './OrderSidebar'
import InputField from '@/components/ui/InputField'

export default function CartView() {
  // ── Корзина ────────────────────────────────────────
  const items      = useCartStore((s) => s.items)
  const itemsTotal = useCartStore(selectTotal)
  const updateQty  = useCartStore((s) => s.updateQty)
  const removeItem = useCartStore((s) => s.removeItem)

  // ── Hydration guard для Zustand persist ────────────
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // ── Поля формы ─────────────────────────────────────
  const [deliveryType,   setDeliveryType]   = useState<DeliveryType>('DELIVERY')
  const [address,        setAddress]        = useState('')
  const [slotIso,        setSlotIso]        = useState<string | null>(null)
  const [customerPhone,  setCustomerPhone]  = useState('')
  const [recipientName,  setRecipientName]  = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [pickupName,     setPickupName]     = useState('')
  const [photoEnabled,   setPhotoEnabled]   = useState(false)
  const [photoPhone,     setPhotoPhone]     = useState('')
  const [comment,        setComment]        = useState('')

  // ── Котировка доставки ─────────────────────────────
  const [deliveryQuote, setDeliveryQuote] = useState<{
    deliveryPrice: number
    isFree:        boolean
    isHoliday:     boolean
    freeFrom:      number
  } | null>(null)

  // ── Слоты ───────────────────────────────────────────
  const [slots, setSlots] = useState<SlotOption[]>([])
  const [slotsLoading, setSlotsLoading] = useState(true)

  // Запрашиваем котировку доставки при смене слота / типа получения / суммы товаров
  useEffect(() => {
    if (deliveryType !== 'DELIVERY' || !slotIso) {
      setDeliveryQuote(null)
      return
    }
    let cancelled = false
    fetch(
      `/api/delivery/quote?scheduledAt=${encodeURIComponent(slotIso)}&itemsTotal=${itemsTotal}`,
    )
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setDeliveryQuote(data) })
      .catch(() => { if (!cancelled) setDeliveryQuote(null) })
    return () => { cancelled = true }
  }, [deliveryType, slotIso, itemsTotal])

  useEffect(() => {
    let cancelled = false
    setSlotsLoading(true)
    fetch('/api/delivery/slots')
      .then((r) => r.json())
      .then((data: { slots: SlotOption[] }) => {
        if (cancelled) return
        setSlots(data.slots)
        if (data.slots[0]) setSlotIso((curr) => curr ?? data.slots[0]!.iso)
      })
      .finally(() => !cancelled && setSlotsLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  // ── Submit ──────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Подсчёт итогов (itemsTotal уже включает аддоны через selectTotal)
  const deliveryPrice: number | null =
    deliveryType === 'PICKUP' ? 0 : (deliveryQuote?.deliveryPrice ?? null)
  const totalPrice = itemsTotal + (deliveryPrice ?? 0)

  // Валидация для активации кнопки
  const formValid = useMemo(() => {
    if (items.length === 0) return false
    if (!slotIso) return false
    if (!customerPhone.trim()) return false
    if (deliveryType === 'DELIVERY') {
      if (!address.trim() || !recipientName.trim() || !recipientPhone.trim()) return false
    } else {
      if (!pickupName.trim()) return false
    }
    if (photoEnabled && !photoPhone.trim()) return false
    return true
  }, [items.length, slotIso, customerPhone, deliveryType, address, recipientName, recipientPhone, pickupName, photoEnabled, photoPhone])

  async function handleSubmit() {
    if (!formValid || submitting) return
    setSubmitting(true)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId:    i.id,
            quantity:     i.qty,
            hasPostcard:  i.hasPostcard ?? false,
            postcardText: i.postcardText,
            hasAquabox:   i.hasAquabox ?? false,
            hasBag:       i.hasBag ?? false,
          })),
          customerPhone,
          deliveryType,
          scheduledAt: slotIso,
          deliveryAddress: deliveryType === 'DELIVERY' ? address : undefined,
          recipientName:   deliveryType === 'DELIVERY' ? recipientName : undefined,
          recipientPhone:  deliveryType === 'DELIVERY' ? recipientPhone : undefined,
          pickupName:      deliveryType === 'PICKUP'   ? pickupName : undefined,
          photoBeforeSend: photoEnabled,
          photoPhone:      photoEnabled ? photoPhone : undefined,
          comment:         comment.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrorMessage(humanError(data?.error))
        setSubmitting(false)
        return
      }

      // Редирект на платёжную страницу bePaid. Корзину НЕ чистим здесь —
      // это сделает /checkout/success после успешной оплаты (при отмене
      // корзина останется для повторной попытки). submitting не сбрасываем —
      // уходим со страницы.
      const data: { orderId: string; publicNumber: string; checkoutUrl: string } = await res.json()
      window.location.href = data.checkoutUrl
    } catch {
      setErrorMessage('Не удалось создать заказ. Попробуйте ещё раз.')
      setSubmitting(false)
    }
  }

  // ── Пустая корзина ──────────────────────────────────
  if (!mounted) {
    return <div className="px-[60px] py-10 max-md:px-4 max-md:py-6 min-h-[40vh]" />
  }

  if (items.length === 0) {
    return (
      <div className="px-[60px] py-20 text-center max-md:px-4 max-md:py-12">
        <h1 className="text-[44px] text-purple m-0 mb-3 max-md:text-[28px]">корзина пуста</h1>
        <p className="text-[18px] text-ink-soft mb-6">Добавьте букет — и он появится здесь.</p>
        <Link
          href="/"
          className="inline-block px-7 py-4 border-[1.5px] border-ink rounded-[8px] bg-ink text-paper text-[18px] hover:opacity-85 transition-opacity"
        >
          Выбрать букет
        </Link>
      </div>
    )
  }

  // ── Layout ──────────────────────────────────────────
  return (
    <section className="grid grid-cols-[1.5fr_1fr] gap-[30px] px-[60px] py-10 items-start max-md:grid-cols-1 max-md:px-4 max-md:py-6 max-md:gap-6">

      {/* ── Левая колонка: корзина + форма ──────────── */}
      <div className="flex flex-col gap-[14px]">

        {/* Список товаров */}
        <div className="flex flex-col gap-[14px]">
          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onQtyChange={updateQty}
              onRemove={removeItem}
            />
          ))}
        </div>

        {/* Способ получения */}
        <div className="mt-2">
          <p className="text-[22px] text-purple m-0 mb-2">способ получения</p>
          <DeliveryToggle value={deliveryType} onChange={setDeliveryType} />
        </div>

        {/* Адрес и время */}
        <div className="mt-2 flex flex-col gap-[10px]">
          <p className="text-[22px] text-purple m-0">адрес и время</p>
          {deliveryType === 'DELIVERY' && (
            <InputField
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Адрес доставки"
            />
          )}
          <SlotPicker
            slots={slots}
            value={slotIso}
            onChange={setSlotIso}
            onDayChange={() => setSlotIso(null)}
            loading={slotsLoading}
          />
        </div>

        {/* Фото перед отправкой */}
        <PhotoBlock
          enabled={photoEnabled}
          phone={photoPhone}
          onEnabledChange={setPhotoEnabled}
          onPhoneChange={setPhotoPhone}
        />

        {/* Комментарий к заказу */}
        <div className="mt-2 flex flex-col gap-[8px]">
          <p className="text-[22px] text-purple m-0">комментарий к заказу</p>
          <p className="text-[13px] text-ink-soft m-0">необязательно</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Пожелания флористу или курьеру…"
            maxLength={500}
            rows={3}
            className={[
              'w-full px-3 py-[10px] text-[15px] text-ink bg-paper',
              'border-[1.5px] border-ink rounded-[6px]',
              'resize-y min-h-[72px]',
              'placeholder:text-ink-soft/60',
              'focus:outline-none focus:border-purple',
              'transition-colors',
            ].join(' ')}
          />
        </div>

        {/* Контакты заказчика */}
        <div className="mt-3 flex flex-col gap-[10px]">
          <p className="text-[22px] text-purple m-0">ваш телефон</p>
          <InputField
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="+375 (__) ___-__-__"
          />
        </div>

        {/* Получатель / самовывоз */}
        {deliveryType === 'DELIVERY' ? (
          <div className="mt-3 flex flex-col gap-[10px]">
            <p className="text-[22px] text-purple m-0">кому везём</p>
            <InputField
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Имя получателя"
            />
            <InputField
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Телефон получателя"
            />
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-[10px]">
            <p className="text-[22px] text-purple m-0">кто заберёт</p>
            <InputField
              value={pickupName}
              onChange={(e) => setPickupName(e.target.value)}
              placeholder="Имя"
            />
          </div>
        )}
      </div>

      {/* ── Правая колонка: итог ─────────────────────── */}
      <OrderSidebar
        itemsTotal={itemsTotal}
        deliveryType={deliveryType}
        deliveryPrice={deliveryPrice}
        isHoliday={deliveryType === 'DELIVERY' && (deliveryQuote?.isHoliday ?? false)}
        totalPrice={totalPrice}
        disabled={!formValid}
        submitting={submitting}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
      />
    </section>
  )
}

function humanError(code: unknown): string {
  switch (code) {
    case 'invalid_slot':         return 'Выбранное время уже недоступно. Выберите другой слот.'
    case 'validation_failed':    return 'Проверьте поля формы.'
    case 'product_unavailable':  return 'Один из товаров больше недоступен.'
    case 'cart_empty':           return 'Корзина пуста.'
    default:                     return 'Не удалось создать заказ. Попробуйте ещё раз.'
  }
}
