/**
 * Conversations для редактирования товара из меню /products.
 *
 * - `editProductField`  — универсальный редактор текстовых полей (name / price / discount).
 *                          Принимает аргументы через `ctx.conversation.enter('editProductField', id, field)`.
 * - `editProductPhotos` — полная замена фото товара. Принимает только `id`.
 *
 * Обе помечены `parallel: true` в bot.ts — чтобы не мешать обработке
 * других callback'ов (status:*, prod:* без edit) пока conversation активна.
 */

import type { Context } from 'grammy'

import { prisma } from '@/lib/db'
import { deletePhoto, uploadPhoto } from '@/lib/cloudinary'
import { addPhotosKeyboard } from '../keyboard'
import { renderProductMenu } from '../render-product'
import type { AdminConversation } from '../types'

type FieldKind = 'name' | 'price' | 'discount'

const MIN_NAME_LEN = 2
const MAX_NAME_LEN = 120
const MAX_PRICE    = 1_000_000
const MAX_PHOTOS   = 5

type UploadedPhoto = { url: string; publicId: string }

// ───────────────────────────────────────────────────────────
// editProductField (name / price / discount)
// ───────────────────────────────────────────────────────────

export async function editProductField(
  conversation: AdminConversation,
  ctx: Context,
  productId: string,
  field: FieldKind,
): Promise<void> {
  // Сначала убедимся, что товар ещё существует.
  const exists = await conversation.external(() =>
    prisma.product.findUnique({ where: { id: productId }, select: { id: true } }),
  )
  if (!exists) {
    await ctx.reply('Товар не найден — возможно, его удалили.')
    return
  }

  const prompt: Record<FieldKind, string> = {
    name:     'Введи новое название:',
    price:    'Новая цена в BYN (например, 99.50):',
    discount: 'Новая скидочная цена в BYN (или 0 — убрать скидку):',
  }
  await ctx.reply(prompt[field])

  // Цикл валидации — переспрашиваем до корректного ввода.
  while (true) {
    const textCtx = await conversation.waitFor('message:text')
    const raw = textCtx.message.text.trim()

    if (field === 'name') {
      if (raw.length < MIN_NAME_LEN || raw.length > MAX_NAME_LEN) {
        await textCtx.reply(`Длина названия: ${MIN_NAME_LEN}–${MAX_NAME_LEN} символов.`)
        continue
      }
      await conversation.external(() =>
        prisma.product.update({ where: { id: productId }, data: { name: raw } }),
      )
      break
    }

    // price / discount — оба парсятся как число
    const num = Number(raw.replace(',', '.'))
    if (!Number.isFinite(num) || num < 0 || num >= MAX_PRICE) {
      await textCtx.reply('Нужно неотрицательное число (например, 99.50).')
      continue
    }

    if (field === 'price') {
      if (num <= 0) {
        await textCtx.reply('Цена должна быть больше нуля.')
        continue
      }
      await conversation.external(() =>
        prisma.product.update({ where: { id: productId }, data: { basePrice: Math.round(num * 100) } }),
      )
      break
    }

    // discount
    const discountKopecks: number | null = num === 0 ? null : Math.round(num * 100)
    await conversation.external(() =>
      prisma.product.update({ where: { id: productId }, data: { discountPrice: discountKopecks } }),
    )
    break
  }

  // Возвращаем пользователю обновлённую карточку товара.
  const menu = await conversation.external(() => renderProductMenu(productId))
  if (!menu) {
    await ctx.reply('Сохранено, но товар уже удалён.')
    return
  }
  await ctx.reply(menu.text, { reply_markup: menu.reply_markup })
}

// ───────────────────────────────────────────────────────────
// editProductPhotos — полная замена фото
// ───────────────────────────────────────────────────────────

async function uploadTelegramPhoto(
  ctx: Context,
  fileId: string,
  token: string,
): Promise<UploadedPhoto | null> {
  try {
    const fileInfo = await ctx.api.getFile(fileId)
    if (!fileInfo.file_path) return null
    const res = await fetch(`https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    return await uploadPhoto(buffer)
  } catch (err) {
    console.error('[telegram] uploadTelegramPhoto failed:', err)
    return null
  }
}

async function rollbackPhotos(photos: UploadedPhoto[]): Promise<void> {
  for (const p of photos) {
    try { await deletePhoto(p.publicId) } catch (err) {
      console.error('[telegram] rollback deletePhoto failed:', err)
    }
  }
}

export async function editProductPhotos(
  conversation: AdminConversation,
  ctx: Context,
  productId: string,
): Promise<void> {
  const exists = await conversation.external(() =>
    prisma.product.findUnique({ where: { id: productId }, select: { id: true } }),
  )
  if (!exists) {
    await ctx.reply('Товар не найден — возможно, его удалили.')
    return
  }

  const token = await conversation.external(() => process.env.TELEGRAM_BOT_TOKEN ?? '')
  if (!token) {
    await ctx.reply('Бот не сконфигурирован: TELEGRAM_BOT_TOKEN отсутствует.')
    return
  }

  await ctx.reply(
    'Пришли новые фото (до 5). Старые будут удалены после нажатия «Готово».',
    { reply_markup: addPhotosKeyboard(0) },
  )

  // Сохраняем только file_id — реальный upload в Cloudinary только один раз
  // по «Готово» (см. ниже). На каждом webhook'е фото-шага IO нет, поэтому
  // 60-сек лимит Telegram не упирается.
  const newPhotoFileIds: string[] = []

  while (true) {
    const next = await conversation.wait()

    if (next.callbackQuery?.data === 'add:cancel') {
      await next.answerCallbackQuery()
      await next.reply('Отменено — старые фото остались.')
      return
    }
    if (next.callbackQuery?.data === 'add:done') {
      await next.answerCallbackQuery()
      if (newPhotoFileIds.length === 0) {
        await next.reply('Нужно прислать хотя бы одно фото.')
        continue
      }
      break
    }

    const photoSizes = next.message?.photo
    if (photoSizes && photoSizes.length > 0) {
      if (newPhotoFileIds.length >= MAX_PHOTOS) {
        await next.reply(`Максимум ${MAX_PHOTOS} фото. Нажми «Готово».`, {
          reply_markup: addPhotosKeyboard(newPhotoFileIds.length),
        })
        continue
      }
      const largest = photoSizes[photoSizes.length - 1]!
      newPhotoFileIds.push(largest.file_id)
      await next.reply(`📸 Фото ${newPhotoFileIds.length} добавлено. Ещё или Готово?`, {
        reply_markup: addPhotosKeyboard(newPhotoFileIds.length),
      })
      continue
    }

    await next.reply('Жду фото или нажатие на кнопку.')
  }

  // Один «долгий» webhook: грузим все новые фото разом.
  await ctx.reply('⏳ Обновляю фото...')

  const newPhotos = await conversation.external(async () => {
    const uploaded: UploadedPhoto[] = []
    for (const fileId of newPhotoFileIds) {
      const result = await uploadTelegramPhoto(ctx, fileId, token)
      if (!result) {
        // Уже загруженные новые фото убираем — старые в БД ещё на месте.
        await rollbackPhotos(uploaded)
        return null
      }
      uploaded.push(result)
    }
    return uploaded
  })

  if (!newPhotos) {
    await ctx.reply('❌ Не удалось загрузить фото в Cloudinary. Старые фото остались.')
    return
  }

  // Замена: грузим список старых, чистим Cloudinary, заменяем в БД одной транзакцией.
  await conversation.external(async () => {
    const old = await prisma.productPhoto.findMany({
      where: { productId },
      select: { id: true, cloudinaryPublicId: true },
    })

    // Сначала удаляем из БД (cascade-safe), потом из Cloudinary.
    // Если Cloudinary упадёт — старые ProductPhoto уже удалены, и новые добавлены.
    // Хранилище может содержать висячие файлы, но БД будет в согласованном состоянии.
    await prisma.$transaction([
      prisma.productPhoto.deleteMany({ where: { productId } }),
      prisma.productPhoto.createMany({
        data: newPhotos.map((p, i) => ({
          productId,
          url: p.url,
          cloudinaryPublicId: p.publicId,
          position: i,
        })),
      }),
    ])

    for (const p of old) {
      if (!p.cloudinaryPublicId) continue   // старые seed-фото без public_id
      try { await deletePhoto(p.cloudinaryPublicId) } catch (err) {
        console.error('[telegram] deletePhoto failed for', p.id, err)
      }
    }
  })

  await ctx.reply(`✅ Фото обновлены (${newPhotos.length} шт).`)

  const menu = await conversation.external(() => renderProductMenu(productId))
  if (menu) {
    await ctx.reply(menu.text, { reply_markup: menu.reply_markup })
  }
}
