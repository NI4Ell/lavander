/**
 * Тонкая обёртка над Cloudinary v2 SDK.
 *
 * Конфигурируется автоматически из env'а — поэтому импорт этого модуля
 * имеет сайд-эффект (cloudinary.config). Это ок: в нашем приложении
 * Cloudinary используется только из Telegram-бота (server-side).
 *
 * `publicId` храним в `ProductPhoto.cloudinaryPublicId`, чтобы при
 * удалении товара/замене фото можно было прибрать файлы за собой и
 * не копить мусор.
 */

import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/** Дефолтная папка для фото товаров. */
export const PRODUCTS_FOLDER = 'lavander/products'

/**
 * Загружает изображение в Cloudinary через upload_stream.
 *
 * SDK-метод принимает callback — оборачиваем в Promise, чтобы можно
 * было `await`'ить. Возвращаем сразу и `secure_url` (для отдачи на сайте),
 * и `public_id` (для удаления потом).
 */
export async function uploadPhoto(
  buffer: Buffer,
  folder: string = PRODUCTS_FOLDER,
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err: Error | undefined, result: UploadApiResponse | undefined) => {
        if (err || !result) {
          reject(err ?? new Error('Cloudinary returned no result'))
          return
        }
        resolve({ url: result.secure_url, publicId: result.public_id })
      },
    )
    stream.end(buffer)
  })
}

/**
 * Удаляет файл из Cloudinary по `public_id`.
 * Используется при отмене wizard'а /add (откат загруженных фото),
 * при замене фото товара и при удалении товара целиком.
 */
export async function deletePhoto(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
}
