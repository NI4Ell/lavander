import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatInTimeZone } from 'date-fns-tz'
import { ru } from 'date-fns/locale'
import { prisma } from '@/lib/db'
import { formatPrice } from '@/lib/format'
import ClearCartOnMount from '@/components/cart/ClearCartOnMount'

export const metadata: Metadata = {
  title: 'Заказ оплачен — Лавандер',
}

export const dynamic = 'force-dynamic'

const TZ = 'Europe/Minsk'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order: publicNumber } = await searchParams
  if (!publicNumber) notFound()

  const order = await prisma.order.findUnique({
    where: { publicNumber },
    select: {
      publicNumber: true,
      totalPrice: true,
      deliveryType: true,
      scheduledAt: true,
      deliveryAddress: true,
    },
  })
  if (!order) notFound()

  const slotLabel = formatInTimeZone(order.scheduledAt, TZ, 'd MMMM, HH:mm', { locale: ru })

  return (
    <div className="px-[60px] py-16 max-w-[760px] mx-auto text-center max-md:px-4 max-md:py-10">
      {/* Корзина очищается только здесь — после успешной оплаты */}
      <ClearCartOnMount />
      <div className="border-[1.5px] border-ink rounded-[18px] px-[40px] py-[40px] bg-lav-soft max-md:px-5 max-md:py-7">
        <p className="text-[22px] m-0" style={{ color: '#b04a6a' }}>
          спасибо!
        </p>
        <h1 className="text-[44px] text-purple font-bold mt-1 mb-3 max-md:text-[30px]">
          ✅ Заказ № {order.publicNumber} принят!
        </h1>
        <p className="text-[18px] text-ink-soft m-0 mb-5 leading-relaxed">
          Флористы уже получили уведомление. Ожидайте звонка для подтверждения.
        </p>

        <div className="grid grid-cols-2 gap-3 text-left mb-6 max-md:grid-cols-1">
          <div className="border-[1.5px] border-ink rounded-[12px] p-4 bg-paper">
            <p className="text-[14px] text-ink-soft m-0">сумма</p>
            <p className="text-[26px] text-ink font-bold m-0 mt-1">{formatPrice(order.totalPrice)}</p>
          </div>
          <div className="border-[1.5px] border-ink rounded-[12px] p-4 bg-paper">
            <p className="text-[14px] text-ink-soft m-0">
              {order.deliveryType === 'DELIVERY' ? 'доставка' : 'самовывоз'}
            </p>
            <p className="text-[20px] text-ink m-0 mt-1">{slotLabel}</p>
            {order.deliveryType === 'DELIVERY' && order.deliveryAddress && (
              <p className="text-[14px] text-ink-soft m-0 mt-1">{order.deliveryAddress}</p>
            )}
          </div>
        </div>

        <Link
          href="/"
          className="inline-block px-7 py-3 border-[1.5px] border-ink rounded-[8px] bg-ink text-paper text-[18px] hover:opacity-85 transition-opacity"
        >
          На главную
        </Link>
      </div>
    </div>
  )
}
