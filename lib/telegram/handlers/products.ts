/**
 * /products — постраничный список товаров + callback'и `prod:*` для меню товара.
 *
 * Все callback'и работают через editMessageText/editMessageReplyMarkup —
 * не плодим новые сообщения на каждую кнопку.
 *
 * Conversation-ы (editProductField, editProductPhotos) запускаются через
 * `ctx.conversation.enter(...)` с передачей productId/field как args.
 */

import type { ProductStatus } from '@prisma/client'
import type { CallbackQueryContext, CommandContext } from 'grammy'

import { prisma } from '@/lib/db'
import {
  PRODUCTS_PAGE_SIZE,
  deleteConfirmKeyboard,
  productsListKeyboard,
} from '../keyboard'
import { deletePhoto } from '@/lib/cloudinary'
import { renderProductMenu } from '../render-product'
import type { AdminContext } from '../types'

// ───────────────────────────────────────────────────────────
// Команда /products и пагинация
// ───────────────────────────────────────────────────────────

const LIST_FIELDS = {
  id: true, name: true, basePrice: true, discountPrice: true,
  status: true, featuredInVitrina: true,
} as const

async function getListPage(page: number) {
  const total = await prisma.product.count()
  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)

  const products = await prisma.product.findMany({
    select: LIST_FIELDS,
    orderBy: { createdAt: 'desc' },
    skip: (safePage - 1) * PRODUCTS_PAGE_SIZE,
    take: PRODUCTS_PAGE_SIZE,
  })

  return { products, page: safePage, totalPages, total }
}

function formatListText({ page, totalPages, total }: { page: number; totalPages: number; total: number }): string {
  if (total === 0) return 'Товаров пока нет. Добавь первый через /add.'
  return `Товары (стр. ${page}/${totalPages}, всего ${total}):`
}

/** Хендлер команды /products. */
export async function listProducts(ctx: CommandContext<AdminContext>): Promise<void> {
  const data = await getListPage(1)
  await ctx.reply(formatListText(data), {
    reply_markup: productsListKeyboard(data.products, data.page, data.totalPages),
  })
}

// ───────────────────────────────────────────────────────────
// Главный роутер callback'ов prod:*
// ───────────────────────────────────────────────────────────

/**
 * Парсим callback_data. Форматы:
 *   prod:page:<n>
 *   prod:open:<id>
 *   prod:back
 *   prod:noop                              ← заглушка для лейбла страницы
 *   prod:status:<id>:<STATUS>
 *   prod:vitrina:<id>
 *   prod:delete:<id>
 *   prod:delete-confirm:<id>
 *   prod:edit:<field>:<id>                 ← field = name|price|discount|photos
 */
export async function handleProductCallback(ctx: CallbackQueryContext<AdminContext>): Promise<void> {
  const data = ctx.callbackQuery.data ?? ''
  const parts = data.split(':')
  // parts[0] === 'prod' гарантировано regex'ом

  const action = parts[1]

  switch (action) {
    case 'noop':
      await ctx.answerCallbackQuery()
      return

    case 'page': {
      const n = Number(parts[2])
      if (!Number.isFinite(n) || n < 1) {
        await ctx.answerCallbackQuery('Битый callback')
        return
      }
      const list = await getListPage(n)
      await ctx.editMessageText(formatListText(list), {
        reply_markup: productsListKeyboard(list.products, list.page, list.totalPages),
      })
      await ctx.answerCallbackQuery()
      return
    }

    case 'back': {
      const list = await getListPage(1)
      await ctx.editMessageText(formatListText(list), {
        reply_markup: productsListKeyboard(list.products, list.page, list.totalPages),
      })
      await ctx.answerCallbackQuery()
      return
    }

    case 'open': {
      const id = parts[2]
      if (!id) { await ctx.answerCallbackQuery('Битый callback'); return }
      const menu = await renderProductMenu(id)
      if (!menu) { await ctx.answerCallbackQuery('Товар не найден'); return }
      await ctx.editMessageText(menu.text, { reply_markup: menu.reply_markup })
      await ctx.answerCallbackQuery()
      return
    }

    case 'status': {
      const id = parts[2]
      const status = parts[3] as ProductStatus | undefined
      if (!id || !status || !['AVAILABLE', 'OUT_OF_STOCK'].includes(status)) {
        await ctx.answerCallbackQuery('Битый callback')
        return
      }
      await prisma.product.update({ where: { id }, data: { status } })
      const menu = await renderProductMenu(id)
      if (!menu) { await ctx.answerCallbackQuery('Товар не найден'); return }
      await ctx.editMessageText(menu.text, { reply_markup: menu.reply_markup })
      await ctx.answerCallbackQuery('Статус обновлён ✓')
      return
    }

    case 'vitrina': {
      const id = parts[2]
      if (!id) { await ctx.answerCallbackQuery('Битый callback'); return }
      const cur = await prisma.product.findUnique({ where: { id }, select: { featuredInVitrina: true } })
      if (!cur) { await ctx.answerCallbackQuery('Товар не найден'); return }
      await prisma.product.update({ where: { id }, data: { featuredInVitrina: !cur.featuredInVitrina } })
      const menu = await renderProductMenu(id)
      if (!menu) { await ctx.answerCallbackQuery('Товар не найден'); return }
      await ctx.editMessageText(menu.text, { reply_markup: menu.reply_markup })
      await ctx.answerCallbackQuery(cur.featuredInVitrina ? 'Убрано с витрины' : 'Добавлено на витрину')
      return
    }

    case 'delete': {
      const id = parts[2]
      if (!id) { await ctx.answerCallbackQuery('Битый callback'); return }
      const product = await prisma.product.findUnique({ where: { id }, select: { name: true } })
      if (!product) { await ctx.answerCallbackQuery('Товар не найден'); return }
      await ctx.editMessageText(
        `⚠️ Точно удалить «${product.name}»? Действие необратимо.`,
        { reply_markup: deleteConfirmKeyboard(id) },
      )
      await ctx.answerCallbackQuery()
      return
    }

    case 'delete-confirm': {
      const id = parts[2]
      if (!id) { await ctx.answerCallbackQuery('Битый callback'); return }

      // Сначала собираем publicId, чтобы потом почистить Cloudinary.
      const photos = await prisma.productPhoto.findMany({
        where: { productId: id },
        select: { cloudinaryPublicId: true },
      })

      // Cascade на ProductPhoto настроен в schema (onDelete: Cascade).
      const deleted = await prisma.product.delete({ where: { id } }).catch(() => null)

      if (!deleted) {
        await ctx.answerCallbackQuery('Товар уже удалён')
      } else {
        for (const p of photos) {
          if (!p.cloudinaryPublicId) continue
          try { await deletePhoto(p.cloudinaryPublicId) } catch (err) {
            console.error('[telegram] deletePhoto failed:', err)
          }
        }
        await ctx.answerCallbackQuery('Удалено ✓')
      }

      // Возвращаемся к списку.
      const list = await getListPage(1)
      await ctx.editMessageText(formatListText(list), {
        reply_markup: productsListKeyboard(list.products, list.page, list.totalPages),
      })
      return
    }

    case 'edit': {
      // prod:edit:<field>:<id>
      const field = parts[2]
      const id    = parts[3]
      if (!field || !id) { await ctx.answerCallbackQuery('Битый callback'); return }

      await ctx.answerCallbackQuery()

      if (field === 'photos') {
        await ctx.conversation.enter('editProductPhotos', id)
        return
      }
      if (field === 'name' || field === 'price' || field === 'discount') {
        await ctx.conversation.enter('editProductField', id, field)
        return
      }
      await ctx.reply('Неизвестное поле для редактирования.')
      return
    }

    default:
      await ctx.answerCallbackQuery('Неизвестное действие')
  }
}
