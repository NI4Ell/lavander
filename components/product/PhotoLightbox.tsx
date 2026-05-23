'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'

interface Props {
  /** Все URL фото товара. */
  photos: string[]
  /** Индекс фото, на которое кликнули (с него начинается навигация). */
  initialIndex: number
  alt: string
  /** Контент-триггер (обёртывается в кнопку). */
  children: React.ReactNode
}

/**
 * Лайтбокс с навигацией между фото товара.
 *
 * - Открывается кликом на children, начиная с initialIndex.
 * - Навигация: кнопки ← / →, клавиши ArrowLeft / ArrowRight.
 * - Закрывается по Escape, клику на фон или кнопке ×.
 * - Точки-индикаторы снизу (не рендерятся при одном фото).
 * - Блокирует скролл страницы пока открыт.
 */
export default function PhotoLightbox({ photos, initialIndex, alt, children }: Props) {
  const [open, setOpen]   = useState(false)
  const [idx,  setIdx]    = useState(initialIndex)

  const multi = photos.length > 1

  const close = useCallback(() => setOpen(false), [])

  const prev = useCallback(() => setIdx((i) => (i - 1 + photos.length) % photos.length), [photos.length])
  const next = useCallback(() => setIdx((i) => (i + 1) % photos.length), [photos.length])

  // Сбрасываем индекс к initialIndex при каждом открытии
  const open_ = useCallback(() => {
    setIdx(initialIndex)
    setOpen(true)
  }, [initialIndex])

  // Клавиатура
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      close()
      if (e.key === 'ArrowLeft'  && multi) prev()
      if (e.key === 'ArrowRight' && multi) next()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, multi, close, prev, next])

  // Блокировать скролл
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const src = photos[idx] ?? photos[0]

  return (
    <>
      {/* Триггер */}
      <button
        type="button"
        onClick={open_}
        className="block w-full cursor-zoom-in focus-visible:outline-none"
        aria-label="Открыть фото"
      >
        {children}
      </button>

      {/* Оверлей */}
      {open && src && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фото"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85"
          onClick={close}
        >
          {/* Кнопка × */}
          <button
            type="button"
            onClick={close}
            aria-label="Закрыть"
            className="absolute top-4 right-5 text-white text-[40px] leading-none hover:opacity-60 transition-opacity z-10 select-none"
          >
            ×
          </button>

          {/* Навигация + фото */}
          <div
            className="relative flex items-center justify-center w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ← */}
            {multi && (
              <button
                type="button"
                onClick={prev}
                aria-label="Предыдущее фото"
                className="absolute left-4 md:left-8 text-white text-[48px] leading-none select-none hover:opacity-60 transition-opacity z-10 px-2"
              >
                ‹
              </button>
            )}

            {/* Фото */}
            <div className="relative w-[88vw] h-[80vh] max-w-[1100px]">
              <Image
                key={src}
                src={src}
                alt={`${alt} — фото ${idx + 1}`}
                fill
                className="object-contain"
                sizes="88vw"
                priority
              />
            </div>

            {/* → */}
            {multi && (
              <button
                type="button"
                onClick={next}
                aria-label="Следующее фото"
                className="absolute right-4 md:right-8 text-white text-[48px] leading-none select-none hover:opacity-60 transition-opacity z-10 px-2"
              >
                ›
              </button>
            )}
          </div>

          {/* Точки-индикаторы */}
          {multi && (
            <div
              className="flex gap-[10px] mt-5"
              onClick={(e) => e.stopPropagation()}
            >
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={`Фото ${i + 1}`}
                  className={[
                    'w-[10px] h-[10px] rounded-full transition-all duration-150',
                    i === idx
                      ? 'bg-white scale-110'
                      : 'bg-white/40 hover:bg-white/70',
                  ].join(' ')}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
