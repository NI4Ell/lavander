import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyWebhookSignature } from '@/lib/bepaid'
import { notifyNewOrder } from '@/lib/telegram/notify'

// bePaid шлёт серверные уведомления — Next не должен кэшировать ответ.
export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/bepaid/webhook
 *
 * Порядок (по правилам CLAUDE.md):
 *   1) verify подписи по СЫРОМУ телу → 401 при провале;
 *   2) идемпотентность — обрабатываем только заказы в PENDING_PAYMENT;
 *   3) бизнес-логика → PAID + уведомление флористов.
 * Всегда отвечаем 200 (кроме невалидной подписи), иначе bePaid ретраит.
 */
export async function POST(req: Request) {
  const rawBody   = await req.text()
  const signature = req.headers.get('Content-Signature')

  if (!verifyWebhookSignature(rawBody, signature)) {
    return new NextResponse('invalid signature', { status: 401 })
  }

  let data: unknown
  try {
    data = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: true })
  }

  const tx      = (data as { transaction?: { status?: string; uid?: string; tracking_id?: string } })?.transaction
  const orderId = tx?.tracking_id

  if (orderId && tx?.status === 'successful') {
    // Идемпотентность: только переход из PENDING_PAYMENT.
    const order = await prisma.order.findUnique({
      where:  { id: orderId },
      select: { status: true },
    })

    if (order?.status === 'PENDING_PAYMENT') {
      await prisma.order.update({
        where: { id: orderId },
        data:  { status: 'PAID', paidAt: new Date(), bepaidUid: tx.uid ?? null },
      })

      // Перечитывает заказ (уже PAID) и шлёт сообщение «(оплачено)».
      await notifyNewOrder(orderId).catch((err) => {
        console.error('[bepaid] notifyNewOrder failed:', err)
      })
    }
  }

  return NextResponse.json({ ok: true })
}
