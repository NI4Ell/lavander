/**
 * Wizard /add — пошаговое добавление товара через бота.
 *
 * Архитектура:
 *   1) Фото: цикл `wait()` + ручной разбор update'а (фото / done / cancel).
 *      Сохраняем ТОЛЬКО `file_id` от Telegram — на этом шаге никакого IO
 *      в Cloudinary нет, поэтому каждый webhook отрабатывает мгновенно
 *      и не упирается в 60-сек лимит Telegram.
 *   2) Текстовые шаги: `waitFor('message:text')` с валидацией и циклом
 *      переспроса при невалидном вводе.
 *   3) Категория и Skip-шаги: `waitForCallbackQuery(/^.../)`.
 *   4) На шаге «Опубликовать» — единственный «долгий» webhook: грузим все
 *      фото в Cloudinary одним проходом и создаём Product. Если хоть одно
 *      фото не загрузилось — откатываем уже загруженные, чтобы не плодить
 *      висячие файлы.
 *   5) Все DB / Cloudinary / Telegram-getFile IO обёрнуто в
 *      `conversation.external` — иначе replay-движок плагина выполнит
 *      вызов несколько раз.
 *
 * При отмене на любом шаге до публикации просто выходим из conversation:
 * в Cloudinary ничего не загружалось, чистить нечего.
 *
 * Conversation помечена parallel в bot.ts, чтобы её не схваченные wait'ом
 * callback'и (`status:*` от заказов в Этапе 3) пропускались дальше по
 * middleware и обрабатывались своими хендлерами.
 */

import type { Category } from '@prisma/client'
import type { Context } from 'grammy'

import { prisma } from '@/lib/db'
import { deletePhoto, uploadPhoto } from '@/lib/cloudinary'
import { generateUniqueSlug } from '@/lib/slug'
import { formatPrice } from '@/lib/format'
import {
  CATEGORY_LABEL,
  addCategoryKeyboard,
  addConfirmKeyboard,
  addPhotosKeyboard,
  addSkipKeyboard,
} from '../keyboard'
import type { AdminContext, AdminConversation } from '../types'

const MIN_NAME_LEN = 2
const MAX_NAME_LEN = 120
const MAX_PHOTOS   = 5
const MAX_PRICE    = 1_000_000   // 1 млн BYN — sanity-cap

/**
 * Фиксированный текст ухода за цветами — одинаковый для всех товаров.
 * Взят из дизайна (index.html). Разделители '. ' использует ProductPage
 * для разбивки на пункты чеклиста.
 */
const CARE_TEXT =
  'Перед тем как поставить цветы в вазу, сделайте свежий срез под углом 45° острым секатором или ножом. ' +
  'Меняйте воду и промывайте вазу каждые 1–2 дня. ' +
  'Не держите цветы вблизи отопительных приборов, фруктов, на сквозняке или под прямыми лучами солнца. ' +
  'Убирайте сразу завявшие цветы из букета. ' +
  'Цветочную композицию в коробке поливайте каждые 2 дня небольшим количеством воды, аккуратно раздвигая стебли, стараясь попасть на флористическую губку.'

type UploadedPhoto = { url: string; publicId: string }

/**
 * Скачивает фото из Telegram и грузит в Cloudinary.
 * Возвращает `null`, если на каком-то шаге случилась ошибка (бот покажет
 * пользователю сообщение и попросит прислать ещё раз).
 */
async function uploadTelegramPhoto(
  ctx: Context,
  fileId: string,
  token: string,
): Promise<UploadedPhoto | null> {
  try {
    const fileInfo = await ctx.api.getFile(fileId)
    if (!fileInfo.file_path) return null

    const url = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`
    const res = await fetch(url)
    if (!res.ok) return null

    const buffer = Buffer.from(await res.arrayBuffer())
    return await uploadPhoto(buffer)
  } catch (err) {
    console.error('[telegram] uploadTelegramPhoto failed:', err)
    return null
  }
}

/** Откатывает все загруженные в Cloudinary фото — используется при «Отмене». */
async function rollbackPhotos(photos: UploadedPhoto[]): Promise<void> {
  for (const p of photos) {
    try {
      await deletePhoto(p.publicId)
    } catch (err) {
      console.error('[telegram] rollback deletePhoto failed:', err)
    }
  }
}

/** Превью карточки товара перед публикацией (шаг 7). */
function buildPreview(data: {
  name: string
  category: Category
  priceKopecks: number
  description: string | null
  composition: string | null
  photosCount: number
}): string {
  const lines = [
    `📋 Проверь данные:`,
    ``,
    `${data.name}`,
    `Категория: ${CATEGORY_LABEL[data.category]}`,
    `Цена: ${formatPrice(data.priceKopecks)}`,
    `Фото: ${data.photosCount}`,
  ]
  if (data.description) lines.push(``, `Описание:`, data.description)
  if (data.composition) lines.push(``, `Состав:`,   data.composition)
  return lines.join('\n')
}

export async function addProductWizard(
  conversation: AdminConversation,
  ctx: Context,
): Promise<void> {
  // Токен нужен для скачивания фото через File API.
  // Делаем через external — токен из env'а считается «внешним» (не от update'а).
  const token = await conversation.external(() => process.env.TELEGRAM_BOT_TOKEN ?? '')
  if (!token) {
    await ctx.reply('Бот не сконфигурирован: TELEGRAM_BOT_TOKEN отсутствует.')
    return
  }

  // Только file_id — каждый webhook отрабатывает мгновенно. Реальный
  // upload в Cloudinary происходит один раз на шаге «Опубликовать».
  // На промежуточных шагах никакого IO в Cloudinary — нечего откатывать
  // при отмене.
  const photoFileIds: string[] = []

  // ── ШАГ 1: Фото ────────────────────────────────────────
  await ctx.reply(
    'Пришли до 5 фото букета (по одному). Нажми «Готово», когда закончишь.',
    { reply_markup: addPhotosKeyboard(0) },
  )

  while (true) {
    const next = await conversation.wait()

    // Callback?
    if (next.callbackQuery?.data === 'add:cancel') {
      await next.answerCallbackQuery()
      await next.reply('Отменено.')
      return
    }
    if (next.callbackQuery?.data === 'add:done') {
      await next.answerCallbackQuery()
      if (photoFileIds.length === 0) {
        await next.reply('Нужно прислать хотя бы одно фото.')
        continue
      }
      break
    }

    // Фото?
    const photoSizes = next.message?.photo
    if (photoSizes && photoSizes.length > 0) {
      if (photoFileIds.length >= MAX_PHOTOS) {
        await next.reply(`Максимум ${MAX_PHOTOS} фото. Нажми «Готово» для продолжения.`, {
          reply_markup: addPhotosKeyboard(photoFileIds.length),
        })
        continue
      }
      // Самое крупное превью — последнее в массиве. Сохраняем только file_id.
      const largest = photoSizes[photoSizes.length - 1]!
      photoFileIds.push(largest.file_id)
      await next.reply(`📸 Фото ${photoFileIds.length} добавлено. Ещё или Готово?`, {
        reply_markup: addPhotosKeyboard(photoFileIds.length),
      })
      continue
    }

    // Что-то другое — переспросим.
    await next.reply('Жду фото или нажатие на кнопку.')
  }

  // ── ШАГ 2: Название ─────────────────────────────────────
  await ctx.reply('Введи название букета:')
  let name = ''
  while (true) {
    const textCtx = await conversation.waitFor('message:text')
    const raw = textCtx.message.text.trim()
    if (raw.length < MIN_NAME_LEN || raw.length > MAX_NAME_LEN) {
      await textCtx.reply(`Длина: ${MIN_NAME_LEN}–${MAX_NAME_LEN} символов. Введи ещё раз.`)
      continue
    }
    name = raw
    break
  }

  // ── ШАГ 3: Категория ────────────────────────────────────
  await ctx.reply('Выбери категорию:', { reply_markup: addCategoryKeyboard() })
  let category: Category
  while (true) {
    const cbCtx = await conversation.waitForCallbackQuery(/^(cat:[A-Z]+|add:cancel)$/)
    await cbCtx.answerCallbackQuery()
    const data = cbCtx.callbackQuery.data ?? ''
    if (data === 'add:cancel') {
      await cbCtx.reply('Отменено.')
      return
    }
    const value = data.slice('cat:'.length) as Category
    if (!['BOUQUET', 'MONO', 'BOX', 'BASKET'].includes(value)) {
      await cbCtx.reply('Неизвестная категория, выбери из списка.')
      continue
    }
    category = value
    break
  }

  // ── ШАГ 4: Цена ─────────────────────────────────────────
  await ctx.reply('Цена в BYN (число, можно с копейками: 99.50):')
  let priceKopecks = 0
  while (true) {
    const priceCtx = await conversation.waitFor('message:text')
    const raw = priceCtx.message.text.trim().replace(',', '.')
    const num = Number(raw)
    if (!Number.isFinite(num) || num <= 0 || num >= MAX_PRICE) {
      await priceCtx.reply('Нужно положительное число (например, 99.50). Попробуй ещё раз.')
      continue
    }
    priceKopecks = Math.round(num * 100)
    break
  }

  // ── ШАГИ 5-6: Опциональные текстовые поля ─────────────────
  const description = await askOptionalText(conversation, ctx, 'Описание (или нажми «Пропустить»):')
  if (description === null) { await ctx.reply('Отменено.'); return }

  const composition = await askOptionalText(conversation, ctx, 'Состав букета (или нажми «Пропустить»):')
  if (composition === null) { await ctx.reply('Отменено.'); return }

  // Шаг «Уход» убран — текст одинаков для всех товаров, задаётся константой.

  // ── ШАГ 7: Подтверждение ────────────────────────────────
  await ctx.reply(
    buildPreview({ name, category, priceKopecks, description, composition, photosCount: photoFileIds.length }),
    { reply_markup: addConfirmKeyboard() },
  )

  const confirmCtx = await conversation.waitForCallbackQuery(/^add:(publish|cancel)$/)
  await confirmCtx.answerCallbackQuery()

  if (confirmCtx.callbackQuery.data === 'add:cancel') {
    await confirmCtx.reply('Отменено.')
    return
  }

  // ── Публикация ──────────────────────────────────────────
  // Все фото грузим в Cloudinary разом — это единственный медленный
  // webhook-запрос за весь wizard. timeoutMilliseconds в webhook'е поднят
  // до 55 сек, на пачку из 5 фото этого хватает с большим запасом.
  await confirmCtx.reply('⏳ Публикую товар...')

  const uploadedPhotos = await conversation.external(async () => {
    const uploaded: UploadedPhoto[] = []
    for (const fileId of photoFileIds) {
      const result = await uploadTelegramPhoto(confirmCtx, fileId, token)
      if (!result) {
        // Если хоть одно фото не загрузилось — откатываем уже загруженные
        // (висячих файлов в Cloudinary не остаётся).
        await rollbackPhotos(uploaded)
        return null
      }
      uploaded.push(result)
    }
    return uploaded
  })

  if (!uploadedPhotos) {
    await confirmCtx.reply('❌ Не удалось загрузить фото в Cloudinary. Попробуй /add ещё раз.')
    return
  }

  const created = await conversation.external(async () => {
    const slug = await generateUniqueSlug(name)
    return prisma.product.create({
      data: {
        slug,
        name,
        category,
        basePrice: priceKopecks,
        // `''` приходит из askOptionalText при skip → пишем null в БД
        description: description || null,
        composition: composition || null,
        care: CARE_TEXT,
        status: 'AVAILABLE',
        photos: {
          create: uploadedPhotos.map((p, i) => ({
            url: p.url,
            cloudinaryPublicId: p.publicId,
            position: i,
          })),
        },
      },
      select: { id: true, slug: true, name: true },
    })
  })

  await confirmCtx.reply(`✅ Товар «${created.name}» добавлен (slug: ${created.slug}).`)
}

/**
 * Хелпер для шагов 5-7. Возвращает:
 *   - `null`   — пользователь нажал «Отмена» (вызывающий делает rollback + return)
 *   - `''`     — пользователь нажал «Пропустить» (в БД пишем `null`)
 *   - текст    — введённый текст (trim'нутый)
 */
async function askOptionalText(
  conversation: AdminConversation,
  ctx: Context,
  prompt: string,
): Promise<string | null> {
  await ctx.reply(prompt, { reply_markup: addSkipKeyboard() })

  while (true) {
    const next = await conversation.wait()

    if (next.callbackQuery?.data === 'add:cancel') {
      await next.answerCallbackQuery()
      return null
    }
    if (next.callbackQuery?.data === 'add:skip') {
      await next.answerCallbackQuery()
      return ''
    }
    if (next.message?.text) {
      return next.message.text.trim()
    }
    await next.reply('Жду текст или нажатие кнопки.')
  }
}
