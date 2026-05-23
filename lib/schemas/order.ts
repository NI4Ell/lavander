import { z } from 'zod'

/**
 * Схема входных данных POST /api/orders.
 * Цены и слот валидируются на сервере (не доверяем клиенту).
 */
export const CreateOrderInput = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.number().int().min(1).max(99),

          // Аддоны (фиксированные цены пересчитываются на сервере)
          hasPostcard:  z.boolean().optional(),
          postcardText: z.string().trim().max(500).optional(),
          hasAquabox:   z.boolean().optional(),
          hasBag:       z.boolean().optional(),
        }),
      )
      .min(1, 'cart_empty'),

    customerPhone: z.string().min(7, 'phone_too_short').max(40),

    deliveryType: z.enum(['DELIVERY', 'PICKUP']),

    /** ISO-8601 UTC. Сервер сверяет с generateSlots(now). */
    scheduledAt: z.string().datetime({ offset: true }),

    // DELIVERY-only
    deliveryAddress: z.string().trim().min(1).max(500).optional(),
    recipientName:   z.string().trim().min(1).max(120).optional(),
    recipientPhone:  z.string().trim().min(7).max(40).optional(),

    // PICKUP-only
    pickupName: z.string().trim().min(1).max(120).optional(),

    // Фото перед отправкой
    photoBeforeSend: z.boolean(),
    photoPhone:      z.string().trim().min(7).max(40).optional(),

    // Необязательный комментарий покупателя
    comment: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryType === 'DELIVERY') {
      if (!data.deliveryAddress) {
        ctx.addIssue({
          code: 'custom',
          path: ['deliveryAddress'],
          message: 'address_required',
        })
      }
      if (!data.recipientName) {
        ctx.addIssue({
          code: 'custom',
          path: ['recipientName'],
          message: 'recipient_name_required',
        })
      }
      if (!data.recipientPhone) {
        ctx.addIssue({
          code: 'custom',
          path: ['recipientPhone'],
          message: 'recipient_phone_required',
        })
      }
    } else {
      if (!data.pickupName) {
        ctx.addIssue({
          code: 'custom',
          path: ['pickupName'],
          message: 'pickup_name_required',
        })
      }
    }

    if (data.photoBeforeSend && !data.photoPhone) {
      ctx.addIssue({
        code: 'custom',
        path: ['photoPhone'],
        message: 'photo_phone_required',
      })
    }
  })

export type CreateOrderInputType = z.infer<typeof CreateOrderInput>
