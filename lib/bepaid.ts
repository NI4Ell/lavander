/**
 * Интеграция с bePaid (bepaid.by) — создание платёжного токена и
 * верификация подписи webhook'а.
 *
 * Документация: https://docs.bepaid.by/ru/checkout/payment-token
 * Деньги — в КОПЕЙКАХ (minor units), bePaid `order.amount` ожидает именно их.
 */

import crypto from 'crypto'

const CHECKOUT_API = 'https://checkout.bepaid.by/ctp/api/checkouts'

interface CreateTokenOrder {
  id:           string
  publicNumber: string
  totalPrice:   number   // копейки
}

/**
 * Создаёт платёжный токен (checkout) в bePaid и возвращает URL для редиректа
 * покупателя + сам token (сохраняем в `Order.bepaidToken`).
 *
 * Бросает Error при отсутствии кредов или неуспешном ответе — вызывающий
 * (POST /api/orders) ловит и возвращает 502.
 */
export async function createPaymentToken(
  order: CreateTokenOrder,
): Promise<{ checkoutUrl: string; token: string }> {
  const shopId = process.env.BEPAID_SHOP_ID
  const secret = process.env.BEPAID_SECRET_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!shopId || !secret) {
    throw new Error('bePaid credentials (BEPAID_SHOP_ID / BEPAID_SECRET_KEY) are not set')
  }

  const auth = Buffer.from(`${shopId}:${secret}`).toString('base64')

  const res = await fetch(CHECKOUT_API, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Accept':        'application/json',
      'X-API-Version': '2',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({
      checkout: {
        ...(process.env.NODE_ENV !== 'production' && { test: true }),
        transaction_type: 'payment',
        order: {
          amount:      order.totalPrice,
          currency:    'BYN',
          description: `Заказ #${order.publicNumber}`,
          tracking_id: order.id,
        },
        settings: {
          success_url:      `${appUrl}/checkout/success?order=${order.publicNumber}`,
          fail_url:         `${appUrl}/checkout/fail?order=${order.publicNumber}`,
          notification_url: `${appUrl}/api/payments/bepaid/webhook`,
        },
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`bePaid checkout failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  const checkoutUrl: string | undefined = data?.checkout?.redirect_url
  const token: string | undefined = data?.checkout?.token

  if (!checkoutUrl || !token) {
    throw new Error('bePaid response missing checkout.redirect_url / checkout.token')
  }

  return { checkoutUrl, token }
}

/**
 * Оборачивает «голый» base64 публичный ключ в PEM-формат
 * (с переносами строк через 64 символа). Если ключ уже в PEM —
 * заголовки/пробелы вычищаются и навешиваются заново.
 */
function toPem(base64Key: string): string {
  const body = base64Key
    .replace(/-----[A-Z ]+-----/g, '')
    .replace(/\s+/g, '')
  const wrapped = body.match(/.{1,64}/g)?.join('\n') ?? body
  return `-----BEGIN PUBLIC KEY-----\n${wrapped}\n-----END PUBLIC KEY-----`
}

/**
 * Верифицирует RSA-SHA256 подпись webhook'а bePaid.
 * `signature` — содержимое заголовка `Content-Signature` (base64).
 * Проверяется против сырого тела запроса (req.text()), НЕ распарсенного JSON.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false

  const rawKey = process.env.BEPAID_PUBLIC_KEY
  if (!rawKey) return false

  try {
    const verifier = crypto.createVerify('SHA256')
    verifier.update(rawBody)
    verifier.end()
    return verifier.verify(toPem(rawKey), signature, 'base64')
  } catch {
    return false
  }
}
