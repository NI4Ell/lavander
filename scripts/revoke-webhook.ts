/**
 * Удаляет webhook бота в Telegram.
 *
 * Usage:
 *   pnpm tg:webhook:revoke
 *
 * .env подгружается через флаг node --env-file-if-exists=.env
 * (см. package.json → tg:webhook:revoke).
 */

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is not set')
    process.exit(1)
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ drop_pending_updates: true }),
  })

  const data = await res.json()
  console.log(JSON.stringify(data, null, 2))

  if (!data.ok) process.exit(1)
  console.log('✅ Webhook removed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

export {}
