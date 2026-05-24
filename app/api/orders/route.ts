import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CreateOrderInput } from '@/lib/schemas/order'
import { generateSlots, TZ } from '@/lib/time-slots'
import { formatInTimeZone } from 'date-fns-tz'
import { generateOrderNumber } from '@/lib/order-number'
import { createPaymentToken } from '@/lib/bepaid'
import { getDeliveryPrice } from '@/lib/delivery-price'

// Фиксированные цены аддонов на единицу товара (копейки).
// СЕРВЕРНЫЙ источник правды — клиентские значения игнорируются.
const ADDON_PRICES = {
  POSTCARD: 200,
  AQUABOX:  1000,
  BAG:      1500,
} as const

export async function POST(req: Request) {
  // 1. Парсинг + валидация формы
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = CreateOrderInput.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const input = parsed.data

  // 2. Валидация слота — сверяем с актуальным списком (с учётом исключений
  //    расписания и того же горизонта в 30 дней, что и в пикере).
  const scheduledAt = new Date(input.scheduledAt)
  const now = new Date()
  const todayUtcMidnight = new Date(`${formatInTimeZone(now, TZ, 'yyyy-MM-dd')}T00:00:00.000Z`)
  const exceptions = await prisma.scheduleException.findMany({
    where: { date: { gte: todayUtcMidnight } },
  })
  const validSlots = generateSlots(now, 30, exceptions)
  const slotOk = validSlots.some((s) => s.getTime() === scheduledAt.getTime())
  if (!slotOk) {
    return NextResponse.json({ error: 'invalid_slot' }, { status: 400 })
  }

  // 3. Фетч продуктов из БД (защита от подмены цен на клиенте)
  const productIds = input.items.map((i) => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: 'AVAILABLE' },
    include: { photos: { orderBy: { position: 'asc' }, take: 1 } },
  })

  if (products.length !== input.items.length) {
    return NextResponse.json({ error: 'product_unavailable' }, { status: 400 })
  }

  // 4. Серверный пересчёт цен (букеты + аддоны)
  const productMap = new Map(products.map((p) => [p.id, p]))
  let itemsTotal = 0
  const orderItemsData = input.items.map((it) => {
    const product = productMap.get(it.productId)!
    const pricePaid = product.discountPrice ?? product.basePrice

    // Серверный пересчёт аддонов
    const postcardText = it.postcardText?.trim() ?? ''
    const hasPostcard  = Boolean(it.hasPostcard)
    const hasAquabox   = Boolean(it.hasAquabox)
    const hasBag       = Boolean(it.hasBag)

    const addonsPrice =
      (hasPostcard ? ADDON_PRICES.POSTCARD : 0) +
      (hasAquabox  ? ADDON_PRICES.AQUABOX  : 0) +
      (hasBag      ? ADDON_PRICES.BAG      : 0)

    // (цена букета + аддоны) × количество
    itemsTotal += (pricePaid + addonsPrice) * it.quantity

    return {
      productId:       product.id,
      productName:     product.name,
      productPhotoUrl: product.photos[0]?.url ?? null,
      pricePaid,
      quantity:        it.quantity,

      hasPostcard,
      postcardText: hasPostcard && postcardText.length > 0 ? postcardText : null,
      hasAquabox,
      hasBag,
      addonsPrice,
    }
  })

  const deliveryPrice = input.deliveryType === 'PICKUP'
    ? 0
    : getDeliveryPrice(scheduledAt, itemsTotal)
  const totalPrice = itemsTotal + deliveryPrice

  // 5. Публичный номер
  const publicNumber = await generateOrderNumber(new Date(), prisma)

  // 6. Создание заказа
  const order = await prisma.order.create({
    data: {
      publicNumber,
      status: 'PENDING_PAYMENT',

      customerPhone: input.customerPhone,

      deliveryType: input.deliveryType,
      scheduledAt,

      deliveryAddress: input.deliveryType === 'DELIVERY' ? input.deliveryAddress : null,
      recipientName:   input.deliveryType === 'DELIVERY' ? input.recipientName   : null,
      recipientPhone:  input.deliveryType === 'DELIVERY' ? input.recipientPhone  : null,

      pickupName: input.deliveryType === 'PICKUP' ? input.pickupName : null,

      photoBeforeSend: input.photoBeforeSend,
      photoPhone:      input.photoBeforeSend ? input.photoPhone ?? null : null,

      comment: input.comment?.trim() || null,

      itemsTotal,
      deliveryPrice,
      totalPrice,

      items: { create: orderItemsData },
    },
    select: { id: true, publicNumber: true, totalPrice: true },
  })

  // 7. Платёжный токен bePaid. Уведомление флористам НЕ шлём здесь —
  //    оно уйдёт из webhook'а после успешной оплаты (заказ → PAID).
  let payment: { checkoutUrl: string; token: string }
  try {
    payment = await createPaymentToken(order)
  } catch (err) {
    console.error('[bepaid] createPaymentToken failed:', err)
    return NextResponse.json({ error: 'payment_init_failed' }, { status: 502 })
  }

  await prisma.order.update({
    where: { id: order.id },
    data:  { bepaidToken: payment.token },
  })

  return NextResponse.json(
    { orderId: order.id, publicNumber: order.publicNumber, checkoutUrl: payment.checkoutUrl },
    { status: 201 },
  )
}
