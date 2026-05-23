/**
 * Регистрирует webhook бота в Telegram.
 *
 * Usage:
 *   pnpm tg:webhook:dev https://abc.ngrok.io
 *   pnpm tg:webhook:prod                       # берёт NEXT_PUBLIC_APP_URL из .env
 *
 * Передаёт secret_token из TELEGRAM_WEBHOOK_SECRET — Telegram будет
 * присылать его в заголовке X-Telegram-Bot-Api-Secret-Token, а
 * webhookCallback на сервере отвергнет запросы без него (401).
 *
 * .env подгружается через флаг node --env-file-if-exists=.env
 * (см. package.json → tg:webhook:*).
 */

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  const baseUrl = (process.argv[2] ?? process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')

  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is not set')
    process.exit(1)
  }
  if (!baseUrl) {
    console.error('Usage: tsx scripts/set-webhook.ts <BASE_URL>')
    console.error('   or: set NEXT_PUBLIC_APP_URL in .env')
    process.exit(1)
  }
  if (!secret) {
    console.warn('⚠️  TELEGRAM_WEBHOOK_SECRET is not set — webhook will be UNPROTECTED')
  }

  const url = `${baseUrl}/api/telegram/webhook`

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      url,
      secret_token: secret ?? undefined,
      // Нам нужны только callback'и от кнопок — сообщения и прочее
      // экономим трафик и не получаем спам в логах.
      // callback_query — кнопки заказов и каталога; message — команды /add, /products
      // и приём фото/текста внутри wizard'ов (см. lib/telegram/conversations/*).
      allowed_updates: ['callback_query', 'message'],
      drop_pending_updates: true,
    }),
  })

  const data = await res.json()
  console.log(JSON.stringify(data, null, 2))

  if (!data.ok) process.exit(1)
  console.log(`✅ Webhook set: ${url}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

export {}
